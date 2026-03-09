<table align="center" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td valign="middle"><img src="apps/web/public/logo.svg" alt="StrivPath" width="52" /></td>
    <td valign="middle"><h1>StrivPath</h1></td>
  </tr>
</table>

<p align="center">
  <em>Stop logging workouts. Start tracking progress.</em>
</p>

<p align="center">
  <a href="https://github.com/titouan-aclr/strivpath/actions/workflows/ci.yml"><img src="https://github.com/titouan-aclr/strivpath/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/TypeScript-blue?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-red?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/GraphQL-pink?logo=graphql&logoColor=white" alt="GraphQL" />
  <img src="https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/pnpm-orange?logo=pnpm&logoColor=white" alt="pnpm" />
</p>

<p align="center">
  <a href="https://strivpath.titouanauclair.com">Live Demo</a> ·
  <a href="https://titouanauclair.com">Portfolio</a>
</p>

---

StrivPath connects to your Strava account and turns your activity history into goal-driven progress tracking. Set meaningful targets, follow your journey across every sport, and celebrate each milestone — built for athletes who want to grow, not just accumulate sessions. Built as a production-grade full-stack application with NestJS, Next.js, and GraphQL.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [GraphQL API](#graphql-api)
- [Development Commands](#development-commands)
- [Testing](#testing)
- [CI/CD & Deployment](#cicd--deployment)

---

## Overview

StrivPath is a goal tracking and progress platform built on top of Strava. It is not a Strava replacement or a general-purpose analytics tool — it is a complement: Strava records what you do, StrivPath helps you figure out where you're going.

After connecting via Strava OAuth 2.0, the app imports your full activity history and lets you set meaningful goals (distance, duration, elevation, frequency) across all your sports. Every activity you sync automatically advances your goals and statistics and dashboards are there to support that journey.

The platform currently supports running, cycling, and swimming, with a sport-agnostic architecture designed to extend to any discipline. Non-commercial and open source — your data is never sold or shared. Available in English and French, with light and dark themes.

---

## Features

| Domain              | Features                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goals**           | Custom goal creation (distance, duration, elevation, frequency), predefined templates (i18n), recurring goals, automatic progress tracking with every sync |
| **Dashboard**       | Global dashboard, sport-specific dashboards (running, cycling, swimming)                                                                                   |
| **Activity Import** | Bulk import from Strava, real-time progress tracking, incremental sync for new activities                                                                  |
| **Statistics**      | Per-sport and global stats to support goal progress — temporal aggregations (weekly, monthly, yearly)                                                      |
| **Activity Detail** | Full activity view with advanced metrics (pace, elevation, HR, cadence, power, calories)                                                                   |
| **Onboarding**      | Sport selection wizard, guided initial sync                                                                                                                |
| **Authentication**  | Strava OAuth 2.0, JWT httpOnly cookies, automatic token refresh, secure refresh token rotation                                                             |
| **i18n**            | English and French (next-intl, locale-aware routing)                                                                                                       |
| **Webhooks**        | Real-time Strava event reception for new/updated activities                                                                                                |
| **Theme**           | Light / Dark / System (next-themes)                                                                                                                        |

---

## Tech Stack

| Layer              | Technology                                  | Version    |
| ------------------ | ------------------------------------------- | ---------- |
| Backend Framework  | NestJS (CommonJS)                           | 11.x       |
| API                | GraphQL · Apollo Server (code-first)        | 16.x / 5.x |
| Database           | PostgreSQL 16 · Prisma ORM                  | 6.x        |
| Auth               | Passport.js · Strava OAuth 2.0 · JWT        | —          |
| Frontend Framework | Next.js (App Router)                        | 16.x       |
| UI                 | React 19 · shadcn/ui · Radix UI             | 19.x       |
| Styling            | Tailwind CSS v4 · CSS Variables             | 4.x        |
| GraphQL Client     | Apollo Client (SSR + CSR)                   | 4.x        |
| Data Visualization | Recharts                                    | 2.x        |
| State / i18n       | next-intl · next-themes                     | —          |
| Code Generation    | GraphQL Code Generator                      | —          |
| Monorepo           | Turborepo · pnpm workspaces                 | 2.x / 10.x |
| Testing (Backend)  | Jest · Supertest · jest-mock-extended       | 30.x       |
| Testing (Frontend) | Vitest · Testing Library · Playwright · MSW | —          |
| CI/CD              | GitHub Actions                              | —          |
| Deployment         | Docker · Docker Compose · Dokploy · Traefik | —          |
| Node               | >= 24                                       | —          |
| Package Manager    | pnpm                                        | 10.30.1    |

---

## Architecture

### Application Diagram

The monorepo contains two applications and three shared config packages. The frontend communicates with the backend exclusively via GraphQL; the backend persists data through Prisma into an external PostgreSQL instance.

```mermaid
flowchart LR
    subgraph Turborepo["Turborepo Monorepo"]
        subgraph stack["Applications"]
            direction TB
            subgraph web["apps/web — Next.js (port 3000)"]
                APP["App Router SSR/CSR"]
            end
            subgraph api["apps/api — NestJS (port 3011)"]
                GQL["GraphQL API"]
                ORM["Prisma ORM"]
                GQL --> ORM
            end
            APP -->|"GraphQL"| GQL
        end
        subgraph pkgs["packages/ — Shared config"]
            direction TB
            P1["config-eslint"]
            P2["config-typescript"]
            P3["config-prettier"]
        end
        stack ~~~ pkgs
    end
    DB[("PostgreSQL 16")]
    ORM --> DB
```

### Request Flow

Inside `apps/api`, each GraphQL operation travels through four layers: the resolver handles the incoming request, the service contains the business logic, the mapper converts Prisma types to GraphQL types, and PrismaService executes the database query.

```mermaid
flowchart TD
    A["GraphQL Request"] --> B["Resolver\napps/api/src/[module]/*.resolver.ts"]
    B --> C["Service\napps/api/src/[module]/*.service.ts"]
    C --> D["Mapper\napps/api/src/[module]/*.mapper.ts"]
    D --> E["PrismaService\napps/api/src/database/prisma.service.ts"]
    E --> F[("PostgreSQL")]
```

### GraphQL Code-First Flow

Types are defined once in the backend using NestJS decorators. The schema is auto-generated on API start, then the frontend runs codegen to produce fully-typed TypeScript bindings for every query and mutation.

```mermaid
flowchart TD
    A["NestJS Decorators\n@ObjectType · @Field · @InputType"] --> B["Auto-generated schema\napps/api/src/schema.gql"]
    B --> C["GraphQL Code Generator\npnpm --filter web codegen"]
    C --> D["TypeScript types\napps/web/gql/  (gitignored — generate locally)"]
```

---

## Project Structure

```
strivpath/
├── apps/
│   ├── api/                          # NestJS GraphQL backend (CommonJS)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # 12 versioned migrations
│   │   │   └── seed.ts               # Database seeder
│   │   ├── src/
│   │   │   ├── activity/             # Activity import & management
│   │   │   ├── auth/                 # Strava OAuth 2.0 + JWT
│   │   │   ├── common/               # Shared utilities & decorators
│   │   │   ├── config/               # Environment configuration
│   │   │   ├── database/             # Prisma service (global module)
│   │   │   ├── goal/                 # Goal management & templates
│   │   │   ├── health/               # Health check endpoints
│   │   │   ├── statistics/           # Stats computation & aggregation
│   │   │   ├── strava/               # Strava API client
│   │   │   ├── sync-history/         # Import job tracking
│   │   │   ├── user/                 # User management
│   │   │   ├── user-preferences/     # Sport selection & settings
│   │   │   ├── webhook/              # Strava webhook handler
│   │   │   ├── schema.gql            # Auto-generated GraphQL schema
│   │   │   └── app.module.ts         # Root module
│   │   └── test/
│   │       ├── mocks/                # Mock factories & services
│   │       ├── helpers/              # Test utilities
│   │       ├── setup.ts              # Unit test setup
│   │       └── setup-e2e.ts          # E2E test setup
│   │
│   └── web/                          # Next.js frontend (ESM)
│       ├── app/
│       │   └── [locale]/
│       │       ├── (public)/         # Landing, login
│       │       ├── (onboarding)/     # Sport selection, sync wizard
│       │       └── (dashboard)/      # Dashboard, activities, goals, sports
│       ├── components/               # UI components (shadcn/ui)
│       ├── graphql/                  # .graphql operation files
│       │   ├── fragments/
│       │   ├── queries/
│       │   └── mutations/
│       ├── gql/                      # Auto-generated types (gitignored)
│       ├── lib/                      # Apollo client, auth utilities
│       ├── i18n/                     # next-intl routing config
│       ├── messages/                 # Translation files (en, fr)
│       └── mocks/                    # MSW handlers for tests
├── packages/
│   ├── config-eslint/                # Shared ESLint config
│   ├── config-typescript/            # Shared TypeScript config
│   └── config-prettier/              # Shared Prettier config
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, build, unit & integration tests
│       ├── e2e.yml                   # End-to-end API tests
│       └── release.yml               # Docker build + Dokploy deploy
├── docker-compose.dev.yml            # Development: PostgreSQL only
├── docker-compose.local.yml          # Full local stack (api + web + db)
├── docker-compose.prod.yml           # Production (Dokploy + Traefik)
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # pnpm workspaces
└── README.md
```

---

## Getting Started

**Prerequisites** (both setups): Node.js >= 24 · pnpm 10.30.1+ · Docker · [Strava Developer Account](https://developers.strava.com/)

---

### Option A — Run with Docker

Full stack in containers. No database configuration needed.

**1. Clone and generate frontend types**

`apps/web/gql/` is gitignored and must exist before the Docker image is built. `pnpm install` is only needed here to run the codegen — Docker handles its own install internally.

```bash
git clone https://github.com/titouan-aclr/strivpath.git
cd strivpath
pnpm install
pnpm --filter web codegen
```

**2. Configure environment**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in the three required values: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN`.

**3. Start**

```bash
docker compose -f docker-compose.local.yml up --build
```

| Service            | URL                           |
| ------------------ | ----------------------------- |
| Web App            | http://localhost:3000         |
| API                | http://localhost:3011         |
| GraphQL Playground | http://localhost:3011/graphql |

---

### Option B — Local Development

For contributing or debugging with hot reload.

**1. Clone and install**

```bash
git clone https://github.com/titouan-aclr/strivpath.git
cd strivpath
pnpm install
```

**2. Start PostgreSQL**

```bash
docker compose -f docker-compose.dev.yml up -d
```

**3. Configure environment variables**

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit both files and fill in the required values (Strava credentials, JWT secrets). All variables are documented in the [Environment Variables](#environment-variables) section.

**4. Initialize the database**

```bash
pnpm --filter api db:migrate:dev
pnpm --filter api generate
```

**5. Generate frontend GraphQL types**

```bash
pnpm --filter web codegen
```

**6. Start development servers**

```bash
pnpm dev
```

| Service            | URL                           |
| ------------------ | ----------------------------- |
| Web App            | http://localhost:3000         |
| API                | http://localhost:3011         |
| GraphQL Playground | http://localhost:3011/graphql |

---

## Environment Variables

### Backend (`apps/api/.env`)

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

### Frontend (`apps/web/.env.local`)

| Variable                       | Description                | Example                               | Required |
| ------------------------------ | -------------------------- | ------------------------------------- | -------- |
| `NEXT_PUBLIC_GRAPHQL_URL`      | GraphQL API endpoint       | `http://localhost:3011/graphql`       | ✅       |
| `NEXT_PUBLIC_APP_URL`          | Frontend base URL          | `http://localhost:3000`               | ✅       |
| `NEXT_PUBLIC_LEGAL_BASE_URL`   | Base URL for legal pages   | `https://example.com`                 | ❌       |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami analytics script URL | `https://umami.example.com/script.js` | ❌       |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami analytics website ID | `abc-123`                             | ❌       |

---

## Database Schema

```mermaid
erDiagram
    User ||--|| StravaToken : has
    User ||--|| UserPreferences : has
    User ||--o{ RefreshToken : has
    User ||--o{ Activity : has
    User ||--o{ SyncHistory : has
    User ||--o{ Goal : has
    Goal }o--o| GoalTemplate : "based on"
    GoalTemplate ||--o{ GoalTemplateTranslation : has

    User {
        int id PK
        int stravaId UK
        string firstname
        string lastname
        string username
        string sex
        string city
        string country
        string profile
        datetime createdAt
        datetime updatedAt
    }
    StravaToken {
        int id PK
        int userId FK
        string accessToken
        string refreshToken
        datetime expiresAt
    }
    RefreshToken {
        int id PK
        int userId FK
        string jti UK
        datetime expiresAt
        bool revoked
        datetime lastUsedAt
    }
    UserPreferences {
        int id PK
        int userId FK
        json selectedSports
        bool onboardingCompleted
    }
    Activity {
        int id PK
        int userId FK
        int stravaId UK
        string name
        string type
        float distance
        int movingTime
        float totalElevationGain
        datetime startDate
        string timezone
        float averageSpeed
        float averageHeartrate
        float averageCadence
        float averageWatts
        float calories
        json splits
        json raw
    }
    SyncHistory {
        int id PK
        int userId FK
        string status
        string stage
        int totalActivities
        int processedActivities
        string errorMessage
        datetime startedAt
        datetime completedAt
    }
    Goal {
        int id PK
        int userId FK
        int templateId FK
        string title
        string targetType
        float targetValue
        string periodType
        datetime startDate
        datetime endDate
        bool isRecurring
        string sportType
        string status
        float currentValue
        datetime completedAt
    }
    GoalTemplate {
        int id PK
        string targetType
        float targetValue
        string periodType
        string sportType
        string category
        bool isPreset
    }
    GoalTemplateTranslation {
        int id PK
        int templateId FK
        string locale
        string title
        string description
    }
```

**12 versioned migrations** — tracked in `apps/api/prisma/migrations/`.

---

## GraphQL API

- **Endpoint**: `http://localhost:3011/graphql`
- **Playground**: available in development mode
- **Schema**: auto-generated from NestJS decorators at `apps/api/src/schema.gql`
- **Authentication**: JWT access token in httpOnly cookie

### Main Operations

**Queries**

| Operation          | Description                           |
| ------------------ | ------------------------------------- |
| `currentUser`      | Authenticated user with preferences   |
| `activities`       | Paginated activity list with filters  |
| `activity`         | Single activity by ID                 |
| `globalStatistics` | Aggregated stats across all sports    |
| `sportStatistics`  | Stats filtered by sport type          |
| `goals`            | User goals (active and completed)     |
| `goalTemplates`    | Predefined goal templates (with i18n) |
| `syncHistory`      | Import job history                    |

**Mutations**

| Operation               | Description                          |
| ----------------------- | ------------------------------------ |
| `importActivities`      | Trigger bulk Strava import           |
| `syncNewActivities`     | Incremental sync for new activities  |
| `createGoal`            | Create a new goal                    |
| `updateGoal`            | Update an existing goal              |
| `deleteGoal`            | Delete a goal                        |
| `updateUserPreferences` | Update sport selection and settings  |
| `logout`                | Invalidate session and clear cookies |

---

## Development Commands

```bash
# Monorepo
pnpm dev                              # All apps in watch mode
pnpm build                            # Build all apps
pnpm lint                             # Lint all packages
pnpm format                           # Format with Prettier

# Database
pnpm --filter api db:migrate:dev      # Create & apply migration
pnpm --filter api db:migrate:deploy   # Apply migrations (production)
pnpm --filter api db:push             # Push schema directly (dev only)
pnpm --filter api generate            # Regenerate Prisma client
pnpm --filter api db:studio           # Open Prisma Studio
pnpm --filter api db:seed             # Seed the database

# GraphQL types
pnpm --filter web codegen             # Generate frontend types once
pnpm --filter web codegen:watch       # Watch mode

# Selective dev
pnpm --filter api dev                 # API only
pnpm --filter web dev                 # Web only
pnpm --filter web dev:full            # Web + codegen watcher (concurrent)
```

---

## Testing

```bash
# All tests
pnpm test                             # Unit tests (Jest + Vitest)
pnpm test:cov                         # With coverage report

# Backend (apps/api)
pnpm --filter api test                # Unit tests (Jest)
pnpm --filter api test:e2e            # E2E tests (real PostgreSQL)
pnpm --filter api test:integration    # Integration tests

# Frontend (apps/web)
pnpm --filter web test                # Vitest unit tests
pnpm --filter web test:e2e            # Playwright E2E tests
pnpm --filter web test:ui             # Vitest UI
```

### Testing Strategy

| Layer               | Tool                      | Approach                                          |
| ------------------- | ------------------------- | ------------------------------------------------- |
| Backend unit        | Jest + jest-mock-extended | PrismaService auto-mocked, isolated service tests |
| Backend integration | Jest + Supertest          | Real PostgreSQL via Docker, full HTTP flow        |
| Backend E2E         | Jest + Supertest          | Auth flows, rate limiting, webhook handling       |
| Frontend unit       | Vitest + Testing Library  | Component rendering, hooks, utilities             |
| Frontend GraphQL    | MSW                       | Mock handlers for all GraphQL operations          |
| Frontend E2E        | Playwright                | Critical user journeys (login, sync, goals)       |

---

## CI/CD & Deployment

### GitHub Actions Workflows

| Workflow      | Triggers                     | Jobs                                                    |
| ------------- | ---------------------------- | ------------------------------------------------------- |
| `ci.yml`      | PR/push to `develop`, `main` | Lint · Build · Unit Tests · Integration Tests           |
| `e2e.yml`     | PR/push to `main`            | E2E API tests (with PostgreSQL service)                 |
| `release.yml` | Push tags `v*`               | Validate · Docker Build & Push to GHCR · Dokploy Deploy |

### Production

- Docker images published to **GitHub Container Registry (GHCR)**
- Deployed via **Dokploy** with **Traefik** as reverse proxy (SSL/TLS)
- PostgreSQL with persistent volumes
- Cross-subdomain cookies: `api.domain.com` ↔ `domain.com` via `COOKIES_DOMAIN`
