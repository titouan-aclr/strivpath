# Integration Tests

This directory contains integration tests that verify interactions between modules with a real PostgreSQL test database.

## Prerequisites

1. **PostgreSQL Test Database**: A test database must be running and accessible
2. **Database Migrations**: All Prisma migrations must be applied to the test database
3. **Environment Variables**: Test environment variables must be configured

## Setup

### 1. Start PostgreSQL Database

Ensure Docker is running and start the PostgreSQL container:

```bash
docker compose up -d
```

### 2. Create Test Database

The test database URL is configured in `test/setup-integration.ts`:

```
postgresql://postgres:postgres@localhost:5432/stravanalytics_test
```

You can create the test database manually:

```bash
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE stravanalytics_test;"
```

Or the integration tests will attempt to apply migrations automatically.

### 3. Apply Migrations

Migrations are automatically applied during test setup, but you can apply them manually:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stravanalytics_test pnpm prisma migrate deploy
```

## Running Tests

### Run all integration tests

```bash
pnpm test:integration
```

### Run in watch mode

```bash
pnpm test:integration:watch
```

### Run specific test file

```bash
pnpm test:integration -- auth-flow.integration.spec.ts
```

## Test Structure

### Test Database Utilities (`test/test-db.ts`)

Provides utilities for managing the test database:

- `setupTestDatabase()`: Initialize test database connection and apply migrations
- `resetTestDatabase()`: Clear all tables and reset sequences between tests
- `closeTestDatabase()`: Close database connection
- `getTestPrismaClient()`: Get Prisma client for direct database access
- `seedTestUser()`: Create test user with default preferences
- `seedTestActivity()`: Create test activity
- `seedTestRefreshToken()`: Create refresh token for testing

### Test Setup (`test/setup-integration.ts`)

Global setup for all integration tests:

- Configures test environment variables
- Sets up test database connection before all tests
- Resets database after each test for isolation
- Closes database connection after all tests
- Sets Jest timeout to 10 seconds

### Integration Test Files

1. **`auth-flow.integration.spec.ts`**: Authentication flow tests
   - User creation and preferences on first authentication
   - User updates on re-authentication
   - Refresh token storage and hashing
   - Token refresh without rotation
   - Logout and token revocation
   - Cascade delete operations

2. **`activity-sync.integration.spec.ts`**: Activity synchronization tests
   - Activity import and sync history creation
   - Sync stage progression
   - Incremental sync with existing activities
   - Sport type filtering
   - Sync failure handling
   - User-scoped activities
   - Optional fields handling
   - BigInt stravaId preservation

3. **`user-preferences.integration.spec.ts`**: User preferences tests
   - Default preferences creation
   - Selected sports updates
   - Onboarding completion logic
   - Independent locale and theme updates
   - Multiple field updates
   - Cascade delete operations
   - Concurrent update handling
   - JSON field storage

## Test Isolation

Each test is completely independent:

- Database is reset after each test using `TRUNCATE TABLE ... CASCADE`
- Sequences are reset to start from 1
- No shared state between tests
- Tests can run in any order

## Performance

Integration tests are optimized for speed:

- Single worker (`maxWorkers: 1`) to avoid database conflicts
- Efficient database cleanup with TRUNCATE
- Realistic mocking of external APIs (Strava)
- Test timeout: 10 seconds per test

## Debugging

### View test output

```bash
pnpm test:integration --verbose
```

### Run single test

```bash
pnpm test:integration -- -t "should create user and preferences on first Strava authentication"
```

### Inspect database state

During debugging, you can connect to the test database:

```bash
psql -U postgres -h localhost -p 5432 -d stravanalytics_test
```

### Common Issues

1. **Docker not running**: Start Docker Desktop before running tests
2. **Database connection failed**: Verify PostgreSQL is running on port 5432
3. **Migrations not applied**: Run `pnpm prisma migrate deploy` manually
4. **Port already in use**: Stop any other PostgreSQL instances on port 5432

## Best Practices

1. **Test real interactions**: Integration tests use real database, not mocks
2. **Clean database**: Always reset database after each test
3. **Mock external APIs**: Mock Strava API calls to avoid rate limits
4. **Test edge cases**: Include null values, empty arrays, large IDs
5. **Verify cascade operations**: Test database constraints and cascades
6. **Check data integrity**: Verify data after operations complete

## Next Steps

- Add E2E tests with Supertest for GraphQL endpoint testing
- Add performance benchmarks for sync operations
- Add tests for background job processing
- Add tests for concurrent user operations
- Add tests for database transactions and rollbacks
