# Integration Tests

Integration tests verify interactions between modules against a real PostgreSQL database. For a general overview of the test strategy, see [`test/README.md`](../README.md).

## Prerequisites

- Docker running with a PostgreSQL container accessible on port 5432
- `apps/api` environment variables configured (see `apps/api/.env.example`)

## Setup

### 1. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Create the test database

```bash
docker exec strivpath-postgres psql -U postgres -c "CREATE DATABASE strivpath_test;"
```

Migrations are applied automatically when the test suite starts. To apply them manually:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/strivpath_test pnpm prisma migrate deploy
```

## Running Tests

```bash
pnpm test:integration           # Run all integration tests
pnpm test:integration:watch     # Watch mode
pnpm test:integration -- -t "test name pattern"   # Run a specific test
```

## Test Files

| File                                        | What it covers                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `auth-flow.integration.spec.ts`             | User creation/update on Strava auth, refresh token storage and hashing, token rotation, logout, cascade deletes |
| `auth-graphql.integration.spec.ts`          | GraphQL auth queries and mutations against a real NestJS module                                                 |
| `auth-oauth-callback.integration.spec.ts`   | OAuth callback route, Strava token exchange, redirect and error handling                                        |
| `activity-sync.integration.spec.ts`         | Bulk import, sync stage progression, incremental sync, sport filtering, failure handling, BigInt stravaId       |
| `activity-detail-fetch.integration.spec.ts` | Single activity fetch from Strava API, DB storage, optional field handling                                      |
| `goal-auto-update.integration.spec.ts`      | Goal progress calculation after activity import, multi-goal updates, completion detection                       |
| `goal-recurring.integration.spec.ts`        | Weekly/monthly/yearly recurring goal cycles, period boundaries                                                  |
| `goal-template.integration.spec.ts`         | Predefined template retrieval, sport filtering, i18n translations                                               |
| `user-preferences.integration.spec.ts`      | Sport selection, onboarding state, locale/theme updates, concurrent updates, cascade deletes                    |

## Test Infrastructure

### Database utilities (`test/test-db.ts`)

- `getTestPrismaClient()` — singleton Prisma client for the `strivpath_test` database
- `seedTestUser(overrides?)` — creates a user with default preferences
- `seedTestActivity(userId, overrides?)` — creates an activity
- `seedTestRefreshToken(userId)` — creates a refresh token for auth tests

### Setup (`test/setup-integration.ts`)

Runs automatically before the suite:

- Sets `DATABASE_URL` to the `strivpath_test` database
- Applies Prisma migrations
- Truncates all tables before each test (clean state, no shared data)
- Closes the database connection after all tests

## Test Isolation

Each test runs against a clean database:

- All tables are truncated before each test with `TRUNCATE TABLE ... CASCADE`
- Identity sequences are reset
- No state shared between tests — tests can run in any order

## Configuration

Defined in `apps/api/jest.integration.config.ts`:

- `testRegex`: `test/integration/.*\.integration\.spec\.ts$`
- `maxWorkers: 1` — prevents database conflicts from parallel execution
- `testTimeout: 10000` (10 seconds per test)

## Debugging

```bash
# Run with verbose output
pnpm test:integration --verbose

# Connect to the test database directly
psql -U postgres -h localhost -p 5432 -d strivpath_test
```

## Best Practices

1. **Use real database**: Integration tests never mock Prisma — the whole point is testing real queries
2. **Mock external APIs**: Always mock Strava API calls to avoid real HTTP requests and rate limits
3. **Use seed helpers**: Use `seedTestUser()` and related helpers from `test-db.ts` rather than raw Prisma inserts
4. **Test edge cases**: Include null values, empty arrays, BigInt IDs, concurrent operations
5. **Verify cascade operations**: Test database constraints and cascade deletes explicitly
