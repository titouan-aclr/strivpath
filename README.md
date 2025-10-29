# Stravanalytics

> Advanced sports analytics and motivation platform for athletes

Stravanalytics is a comprehensive full-stack application that imports activity data from Strava via OAuth 2.0, performs advanced statistical analysis, and provides personalized insights, goal tracking, and motivational feedback to athletes across multiple sports disciplines.

## Core Features

- **Performance Analytics**: Deep analysis of training data with progression tracking and comparative insights
- **Multi-Sport Support**: Unified platform for running, cycling, swimming, and future sport disciplines
- **Motivation Engine**: Automated feedback, goal tracking, badges, and rewards system
- **Personalization**: Sport-specific dashboards, customizable objectives, and tailored recommendations

## Tech Stack

- **Backend**: NestJS with GraphQL (code-first), PostgreSQL, Prisma ORM
- **Frontend**: Next.js 16 (React 19), Apollo Client, shadcn/ui
- **Monorepo**: Turborepo with pnpm workspaces
- **Authentication**: Passport.js (Strava OAuth2 + JWT with httpOnly cookies)
- **Internationalization**: next-intl (EN/FR support)
- **Styling**: Tailwind CSS v4 with dark/light theme
- **Testing**: Jest (backend), Vitest + Playwright (frontend)

## Project Structure

```
.
├── apps/
│   ├── api/          # NestJS GraphQL backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── graphql-types/      # Shared GraphQL types (dual ESM/CJS build)
│   ├── config-eslint/      # Shared ESLint configuration
│   ├── config-typescript/  # Shared TypeScript configuration
│   └── config-prettier/    # Shared Prettier configuration
└── turbo.json        # Turborepo pipeline configuration
```

## Prerequisites

- Node.js >= 18
- pnpm 10.8.1
- Docker (for PostgreSQL)
- Strava Developer Account ([create app](https://www.strava.com/settings/api))

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment variables

**Backend (`apps/api/.env`)**:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/stravanalytics"
STRAVA_CLIENT_ID="your_strava_client_id"
STRAVA_CLIENT_SECRET="your_strava_client_secret"
STRAVA_CALLBACK_URL="http://localhost:3011/v1/auth/strava/callback"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRATION="7d"
```

**Frontend (`apps/web/.env.local`)**:

```env
NEXT_PUBLIC_GRAPHQL_URL="http://localhost:3011/graphql"
```

### 4. Initialize database

```bash
pnpm --filter api db:push
pnpm --filter api generate
```

### 5. Run development servers

```bash
pnpm dev
```

- **API**: http://localhost:3011
- **GraphQL Playground**: http://localhost:3011/graphql
- **Web**: http://localhost:3000

## Development Commands

### Running applications

```bash
pnpm dev                    # Run all apps in watch mode
pnpm --filter api dev       # Run only API
pnpm --filter web dev       # Run only frontend
```

### Database operations

```bash
pnpm --filter api db:push           # Push schema changes (development)
pnpm --filter api db:migrate:dev    # Create and apply migration
pnpm --filter api db:migrate:deploy # Apply migrations (production)
pnpm --filter api generate          # Generate Prisma client
```

### Building

```bash
pnpm build                  # Build all apps and packages
pnpm --filter api build     # Build API only
pnpm --filter web build     # Build frontend only
```

### Testing

```bash
pnpm test                   # Run all tests
pnpm test:watch             # Run tests in watch mode
pnpm test:cov               # Run tests with coverage
pnpm --filter api test:e2e  # Run API e2e tests
pnpm --filter web test:e2e  # Run frontend e2e tests (Playwright)
```

### Code quality

```bash
pnpm lint                   # Lint all packages
pnpm format                 # Format code with Prettier
```

## Module System

This project uses a **hybrid module approach**:

- **Backend (CommonJS)**: NestJS with stable decorator support
- **Frontend (ESM)**: Next.js 15 with modern ESM-first architecture
- **Shared Types (Dual Build)**: Both ESM and CJS exports for compatibility

After modifying `packages/graphql-types`, rebuild:

```bash
pnpm --filter @repo/graphql-types build
```

## Architecture

### Backend (apps/api)

- **Pattern**: Resolvers → Services → Database (Prisma)
- **GraphQL**: Code-first approach with auto-generated schema
- **Database**: PostgreSQL with Prisma ORM
- **Type Mapping**: Prisma types → GraphQL types (via mappers)

### Frontend (apps/web)

- **Framework**: Next.js 16 with App Router
- **Data Fetching**: Apollo Client (SSR + CSR with streaming support)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS v4 with CSS variables
- **Theme**: next-themes (light/dark/system)
- **Internationalization**: next-intl (EN/FR)
- **Code Generation**: GraphQL Code Generator with fragment masking

## Database Schema

**Current Models:**

- **User**: Strava athlete data (stravaId, profile info)
- **StravaToken**: OAuth tokens with expiration tracking
- **RefreshToken**: JWT refresh tokens with secure storage (hashed)
- **UserPreferences**: User settings (sports, locale, theme)
- **Activity**: Imported Strava activities
- **SyncHistory**: Activity synchronization tracking

See `.claude/IMPLEMENTATION_PLAN.md` for complete schema details.

## Git Workflow

Commits follow conventional commit format enforced by commitlint:

```
<type>(<scope>): <description>

[optional body]
```

**Types**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `build`

Pre-commit hooks run linting and formatting via husky + lint-staged.

## Environment Requirements

- Node.js >= 18
- pnpm 10.8.1 (enforced via packageManager field)
- PostgreSQL 15+ (via Docker)
