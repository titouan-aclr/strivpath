# StrivPath API — NestJS GraphQL Backend

NestJS GraphQL backend for StrivPath. Uses a code-first approach, **CommonJS modules** (no `.js` extensions in imports, stable decorator execution and DI), and a strict layered architecture (Resolver → Service → Mapper → Prisma).

→ For project overview, screenshots, and setup instructions, see the [root README](../../README.md).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Module Architecture](#module-architecture)
- [Architecture Pattern](#architecture-pattern)
- [Auth Flow](#auth-flow)
- [Strava App Setup](#strava-app-setup)
- [GraphQL Operations](#graphql-operations)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Code-First Schema Generation](#code-first-schema-generation)

---

## Tech Stack

| Technology                            | Version    |
| ------------------------------------- | ---------- |
| NestJS (CommonJS)                     | 11.x       |
| GraphQL · Apollo Server               | 16.x / 5.x |
| PostgreSQL · Prisma ORM               | 16 / 6.x   |
| Passport.js · Strava OAuth 2.0 · JWT  | —          |
| Jest · Supertest · jest-mock-extended | 30.x       |
| class-validator · class-transformer   | —          |

---

## Module Architecture

```
src/
├── activity/             # Activity import, sync & retrieval
│   ├── models/           # @ObjectType GraphQL models
│   ├── dto/              # @InputType GraphQL inputs
│   ├── enums/            # Sport type and status enums
│   ├── activity.resolver.ts
│   ├── activity.service.ts
│   └── activity.mapper.ts
├── auth/                 # Strava OAuth 2.0 + JWT session
│   ├── guards/           # GqlAuthGuard, JwtAuthGuard
│   └── strategies/       # Strava, JWT Passport strategies
├── common/               # Shared utilities and decorators
├── config/               # Environment variable configuration
├── database/             # Global PrismaService module
│   └── prisma.service.ts
├── goal/                 # Goal management and templates
├── health/               # /health endpoint (HealthModule)
├── statistics/           # Stats computation and aggregation
├── strava/               # Strava API client
├── sync-history/         # Import job tracking
├── user/                 # User management
├── user-preferences/     # Sport selection and settings
├── webhook/              # Strava event webhook handler
├── schema.gql            # Auto-generated GraphQL schema
└── app.module.ts         # Root module

prisma/
├── schema.prisma         # Database schema (source of truth)
├── migrations/           # 12 versioned Prisma migrations
└── seed.ts               # Database seeder

test/
├── mocks/                # Mock factories (PrismaService, entities)
├── helpers/              # Test utilities
├── setup.ts              # Unit test setup (auto-mock PrismaService)
└── setup-e2e.ts          # E2E test setup (real DB, cleanup)
```

---

## Architecture Pattern

**Resolvers → Services → Mappers → Prisma**

```typescript
// Resolver: handles GraphQL operations
@Resolver(() => User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  async currentUser(@CurrentUser() user: User) {
    return this.userService.findById(user.id);
  }
}

// Service: business logic only
@Injectable()
export class UserService {
  async findById(id: number) {
    const prismaUser = await this.prisma.user.findUnique({ where: { id } });
    return prismaUser ? UserMapper.toGraphQL(prismaUser) : null;
  }
}

// Mapper: converts Prisma types to GraphQL types
export class UserMapper {
  static toGraphQL(prismaUser: PrismaUser): User {
    return { id: prismaUser.id, username: prismaUser.username, ... };
  }
}
```

**Critical**: Prisma types are never exposed directly via GraphQL — mappers enforce the boundary.

---

## Auth Flow

```
Browser → GET /v1/auth/strava
        ← redirect to Strava OAuth consent page

Strava  → GET /v1/auth/strava/callback?code=...
        → exchange code for Strava access + refresh tokens
        → upsert User and StravaToken in DB
        → issue JWT access token (15m) + refresh token (7d, hashed in DB)
        ← Set-Cookie: access_token (httpOnly) + refresh_token (httpOnly)

GraphQL → Authorization via GqlAuthGuard → JwtStrategy
        → @CurrentUser() decorator extracts user from JWT payload

Refresh → POST /v1/auth/refresh
        → validate refresh token JTI (DB lookup + revocation check)
        → rotate: revoke old token, issue new pair
        ← Set-Cookie: new access_token + refresh_token

Logout  → GraphQL mutation logout
        → revoke refresh token in DB
        ← clear cookies
```

**Strava tokens** (separate from JWT) are stored in `StravaToken` and used by `StravaModule` to call the Strava API on behalf of the user.

---

## Strava App Setup

You need a Strava API application to run StrivPath. This is a one-time setup at [strava.com/settings/api](https://www.strava.com/settings/api).

1. Go to `https://www.strava.com/settings/api` and create a new application
2. Fill in the required fields:
   - **Application Name**: anything (e.g. `StrivPath Local`)
   - **Website**: `http://localhost`
   - **Authorization Callback Domain**: `localhost` — no protocol, no port
3. Note your **Client ID** and **Client Secret** and set them in `apps/api/.env`:
   ```
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   STRAVA_REDIRECT_URI=http://localhost:3011/v1/auth/strava/callback
   ```
4. `STRAVA_WEBHOOK_VERIFY_TOKEN` is a string you define freely — it is sent back by Strava to verify webhook subscription ownership. Any non-empty string works for development.

> The **Authorization Callback Domain** in the Strava app settings must match the domain of `STRAVA_REDIRECT_URI` (without protocol or port). `localhost` covers any port on localhost.

---

## GraphQL Operations

Full schema at `src/schema.gql`. All operations require authentication unless noted.

**Queries**

| Operation          | Description                          |
| ------------------ | ------------------------------------ |
| `currentUser`      | Authenticated user with preferences  |
| `activities`       | Paginated activity list with filters |
| `activity`         | Single activity by ID                |
| `globalStatistics` | Aggregated stats across all sports   |
| `sportStatistics`  | Stats filtered by sport type         |
| `goals`            | User goals (active and completed)    |
| `goalTemplates`    | Predefined templates (i18n, public)  |
| `syncHistory`      | Import job history                   |

**Mutations**

| Operation               | Description                         |
| ----------------------- | ----------------------------------- |
| `importActivities`      | Trigger bulk Strava activity import |
| `syncNewActivities`     | Incremental sync for new activities |
| `createGoal`            | Create a new goal                   |
| `updateGoal`            | Update an existing goal             |
| `deleteGoal`            | Delete a goal                       |
| `updateUserPreferences` | Update sport selection and settings |
| `logout`                | Revoke session and clear cookies    |

**REST endpoints** (outside GraphQL prefix)

| Method | Path                       | Description                      |
| ------ | -------------------------- | -------------------------------- |
| `GET`  | `/v1/auth/strava`          | Initiate Strava OAuth flow       |
| `GET`  | `/v1/auth/strava/callback` | OAuth callback (Strava redirect) |
| `POST` | `/v1/auth/refresh`         | Rotate JWT tokens                |
| `POST` | `/v1/webhook`              | Strava webhook event receiver    |
| `GET`  | `/health`                  | Health check                     |

---

## Database Schema

Source of truth: `prisma/schema.prisma` — 12 versioned migrations in `prisma/migrations/`.

See the [root README](../../README.md#database-schema) for the full ER diagram.

---

## Environment Variables

See `.env.example` for the full list.

| Variable                       | Description                              | Example                                                   | Required |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------------- | -------- |
| `DATABASE_URL`                 | PostgreSQL connection string             | `postgresql://postgres:password@127.0.0.1:5432/strivpath` | ✅       |
| `STRAVA_CLIENT_ID`             | Strava app client ID                     | `12345`                                                   | ✅       |
| `STRAVA_CLIENT_SECRET`         | Strava app secret                        | `abc...`                                                  | ✅       |
| `STRAVA_REDIRECT_URI`          | OAuth callback URL                       | `http://localhost:3011/v1/auth/strava/callback`           | ✅       |
| `STRAVA_WEBHOOK_VERIFY_TOKEN`  | Token for Strava webhook verification    | `my_token`                                                | ✅       |
| `JWT_ACCESS_TOKEN_SECRET`      | Secret for signing access tokens         | min 32 chars                                              | ✅       |
| `JWT_REFRESH_TOKEN_SECRET`     | Secret for signing refresh tokens        | min 32 chars                                              | ✅       |
| `FRONTEND_URL`                 | Frontend origin for CORS                 | `http://localhost:3000`                                   | ✅       |
| `JWT_ACCESS_TOKEN_EXPIRATION`  | Access token TTL                         | `15m`                                                     | ❌       |
| `JWT_REFRESH_TOKEN_EXPIRATION` | Refresh token TTL                        | `7d`                                                      | ❌       |
| `PORT`                         | API server port                          | `3011`                                                    | ❌       |
| `NODE_ENV`                     | Runtime environment                      | `development`                                             | ❌       |
| `COOKIES_SAME_SITE`            | Cookie SameSite policy                   | `lax`                                                     | ❌       |
| `COOKIES_SECURE`               | Secure cookies flag                      | `false` (dev)                                             | ❌       |
| `COOKIES_DOMAIN`               | Cookie domain for cross-subdomain (prod) | `.yourdomain.com`                                         | ❌       |
| `TOKEN_CLEANUP_ENABLED`        | Enable expired token cleanup job         | `true`                                                    | ❌       |
| `THROTTLE_DEFAULT_TTL`         | Rate limit window in ms                  | `60000`                                                   | ❌       |
| `THROTTLE_DEFAULT_LIMIT`       | Max requests per window                  | `100`                                                     | ❌       |

---

## Development

**Prerequisites**: PostgreSQL running · `.env` configured from `.env.example`

```bash
# Start PostgreSQL (from repo root)
docker compose -f docker-compose.dev.yml up -d

# Start API in watch mode (port 3011)
pnpm dev

# Build (CommonJS output to dist/)
pnpm build

# Database
pnpm db:migrate:dev       # Create & apply migration
pnpm db:migrate:deploy    # Apply migrations (production)
pnpm db:push              # Push schema directly (dev only)
pnpm generate             # Regenerate Prisma client after schema change
pnpm db:studio            # Open Prisma Studio
pnpm db:seed              # Seed the database
```

Server: `http://localhost:3011`
GraphQL Playground: `http://localhost:3011/graphql` (bypasses `/v1` global prefix)

---

## Testing

```bash
pnpm test                 # Unit tests
pnpm test:watch           # Watch mode
pnpm test:cov             # With coverage
pnpm test:e2e             # E2E tests (requires running database)
pnpm test:integration     # Integration tests (requires running database)
```

### Unit Tests

`PrismaService` is auto-mocked via `test/setup.ts`. Use the provided factories:

```typescript
import { createMockPrismaService } from '../test/mocks/prisma.mock';
import { createMockPrismaUser } from '../test/mocks/factories';

const mockPrisma = createMockPrismaService();
mockPrisma.user.findUnique.mockResolvedValue(createMockPrismaUser());
```

### E2E / Integration Tests

Uses a real PostgreSQL database with full cleanup between tests. Set `DATABASE_URL` to a dedicated test database.

→ See [test/README.md](test/README.md) for detailed setup, database helpers, and all 9 integration test files.

---

## Code-First Schema Generation

`src/schema.gql` is auto-generated on server start from NestJS decorators — never edit it manually.

| Decorator                                  | Role                              | Location        |
| ------------------------------------------ | --------------------------------- | --------------- |
| `@ObjectType()`                            | GraphQL object types              | `models/`       |
| `@InputType()`                             | Input types                       | `dto/`          |
| `@Field()`                                 | Field definitions and nullability | inline          |
| `registerEnumType()`                       | Enum registration                 | `enums/`        |
| `@Resolver()` / `@Query()` / `@Mutation()` | Operations                        | `*.resolver.ts` |

Schema is sorted alphabetically (`sortSchema: true`). After modifying types, restart the API to regenerate `schema.gql`, then run `pnpm --filter web codegen` from the repo root to update frontend types.
