# API - NestJS GraphQL Backend

GraphQL API backend for StrivPath, built with NestJS using a code-first approach.

## Tech Stack

- **Framework**: NestJS (CommonJS modules)
- **API**: GraphQL via Apollo Server (code-first)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js (Strava OAuth2 + JWT)
- **Testing**: Jest with jest-mock-extended
- **Validation**: class-validator

## Key Features

- GraphQL code-first schema generation
- Strava OAuth 2.0 authentication flow
- JWT-based session management
- Auto-generated GraphQL schema at `src/schema.gql`
- Type-safe database access via Prisma
- Strict separation: Prisma types → GraphQL types (via mappers)

## Module System

Uses **CommonJS** for production stability:

- TypeScript `"module": "commonjs"`
- No `.js` extensions in imports
- Stable decorator and dependency injection support

## Project Structure

```
src/
├── auth/               # Authentication (Strava OAuth + JWT)
│   ├── guards/        # Auth guards
│   └── strategies/    # Passport strategies
├── user/              # User module
│   ├── user.service.ts
│   ├── user.resolver.ts
│   └── user.mapper.ts
├── database/          # Database module (global)
│   └── prisma.service.ts
└── app.module.ts      # Root module

prisma/
└── schema.prisma      # Database schema

test/
├── mocks/            # Mock factories and services
├── helpers/          # Test helpers
├── setup.ts          # Unit test setup (auto-mock PrismaService)
└── setup-e2e.ts      # E2E test setup
```

## Architecture Pattern

**Resolvers → Services → Database**

```typescript
// 1. Resolver handles GraphQL requests
@Resolver(() => User)
export class UserResolver {
  @Query(() => User)
  async userByStravaId(@Args('stravaId') stravaId: number) {
    return this.userService.findByStravaId(stravaId);
  }
}

// 2. Service contains business logic
@Injectable()
export class UserService {
  async findByStravaId(stravaId: number) {
    const prismaUser = await this.prisma.user.findUnique(...);
    return UserMapper.toGraphQL(prismaUser);
  }
}

// 3. Mapper converts Prisma types → GraphQL types
export class UserMapper {
  static toGraphQL(prismaUser: PrismaUser): User {
    return { ...prismaUser };
  }
}
```

**Critical**: Never expose Prisma types via GraphQL. Always use mappers.

## Database Schema

**User**

- Core athlete data from Strava
- One-to-many relationship with StravaToken

**StravaToken**

- OAuth access/refresh tokens
- Token expiration tracking
- Cascade delete with User

## Development

### Prerequisites

- PostgreSQL running (via `docker compose up -d` from root)
- Environment variables configured in `.env`

### Running

```bash
# From root
pnpm --filter api dev

# Or from apps/api
pnpm dev
```

Server runs at: http://localhost:3011

### GraphQL Playground

Available at: http://localhost:3011/graphql

The GraphQL endpoint bypasses the global `/v1` prefix.

### Database Operations

```bash
# Push schema changes (development)
pnpm db:push

# Generate Prisma client (after schema changes)
pnpm generate

# Create migration (production-ready)
pnpm db:migrate:dev

# Apply migrations (production)
pnpm db:migrate:deploy
```

## Testing

### Unit Tests

```bash
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode
pnpm test:cov          # With coverage
```

**Setup**: PrismaService is auto-mocked via `test/setup.ts`

Example:

```typescript
import { createMockPrismaService } from '../test/mocks/prisma.mock';
import { createMockPrismaUser } from '../test/mocks/factories';

const mockPrisma = createMockPrismaService();
mockPrisma.user.findUnique.mockResolvedValue(createMockPrismaUser());
```

### E2E Tests

```bash
pnpm test:e2e
```

**Setup**: Uses real database with cleanup via `test/setup-e2e.ts`

## Environment Variables

Required in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/strivpath"
STRAVA_CLIENT_ID="your_client_id"
STRAVA_CLIENT_SECRET="your_client_secret"
STRAVA_CALLBACK_URL="http://localhost:3011/v1/auth/strava/callback"
JWT_SECRET="your_secret_key"
JWT_EXPIRATION="7d"
```

## Building

```bash
pnpm build
```

Outputs to `dist/` directory.

## Scripts

- `dev` - Start in watch mode (port 3011)
- `build` - Compile TypeScript to CommonJS
- `start:prod` - Run production build
- `test` - Run unit tests
- `test:e2e` - Run e2e tests
- `test:cov` - Generate coverage report
- `lint` - Run ESLint
- `db:push` - Push schema to database (dev)
- `db:migrate:dev` - Create migration
- `db:migrate:deploy` - Apply migrations (prod)
- `generate` - Generate Prisma client

## Code Quality

- **TypeScript strict mode** enabled
- **ESLint** with TypeScript rules
- **No code comments** - self-documenting code only
- **Dependency injection** via NestJS DI container
- **Layered architecture** enforced

## GraphQL Schema

Auto-generated at `src/schema.gql` on server start.

Uses NestJS decorators for schema definition:

- `@ObjectType()` - GraphQL object types
- `@InputType()` - Input types
- `@Field()` - Field definitions
- `@Resolver()` - Query/Mutation resolvers
- `@Query()` / `@Mutation()` - Operations

Schema is sorted alphabetically via `sortSchema: true`.
