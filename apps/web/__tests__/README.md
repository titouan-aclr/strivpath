# Frontend Testing Guide

This directory contains E2E tests using Playwright for the Next.js application.

## Directory Structure

```
apps/web/
├── __tests__/                # E2E tests (Playwright)
│   └── *.spec.ts
├── app/                      # Next.js app directory
│   ├── page.tsx
│   └── page.test.tsx         # Component tests (Vitest)
├── lib/
│   └── *.test.ts             # Unit tests (Vitest)
├── mocks/                    # MSW mock handlers
│   ├── handlers.ts
│   └── server.ts
├── vitest.config.ts          # Vitest configuration
├── vitest.setup.ts           # Vitest global setup
└── playwright.config.ts      # Playwright configuration
```

## Test Types

### Unit & Component Tests (Vitest)

Tests are located **next to the code** they test:

```
app/
├── page.tsx
└── page.test.tsx              ← Component test

lib/
├── apollo-client.ts
└── apollo-client.test.ts      ← Unit test
```

**Naming convention**: `*.test.ts` or `*.test.tsx`

**Run unit/component tests**:

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Interactive UI mode
pnpm test:cov          # With coverage
```

### E2E Tests (Playwright)

E2E tests are located in the `__tests__/` directory:

```
__tests__/
├── home.spec.ts              ← Homepage E2E tests
└── auth.spec.ts              ← Authentication flow tests
```

**Naming convention**: `*.spec.ts`

**Run e2e tests**:

```bash
pnpm test:e2e          # Run all E2E tests
pnpm test:e2e:ui       # Interactive UI mode
```

## Writing Component Tests

### Testing a Server Component

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('should render the heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /strivpath/i })).toBeInTheDocument();
  });
});
```

### Testing with GraphQL Mocks (MSW)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { graphql, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import UsersPage from './users/page';

describe('UsersPage', () => {
  beforeEach(() => {
    server.use(
      graphql.query('GetUsers', () => {
        return HttpResponse.json({
          data: {
            users: [
              {
                id: '1',
                stravaId: 12345,
                username: 'john_doe',
                firstname: 'John',
                lastname: 'Doe',
              },
            ],
          },
        });
      })
    );
  });

  it('should display users from GraphQL API', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });
  });
});
```

## E2E Test Infrastructure

The E2E testing infrastructure provides complete isolation with dedicated database, authentication helpers, and Playwright fixtures.

### Directory Structure (E2E)

```
__tests__/
├── setup/
│   ├── global-setup.ts          # Database initialization and migrations
│   ├── global-teardown.ts       # Cleanup after all tests
│   └── db-helpers.ts            # Database utilities (reset, seed)
├── fixtures/
│   ├── auth.fixture.ts          # Playwright fixtures with auth support
│   └── test-data.ts             # Test data constants
├── helpers/
│   ├── auth.ts                  # Auth helpers (login, logout, wait)
│   └── cookies.ts               # Cookie management helpers
└── auth/
    └── smoke.spec.ts            # Infrastructure validation tests
```

### Database Setup

E2E tests use a dedicated database: `strivpath_test_e2e`

Create the database:

```bash
docker exec strivpath-postgres psql -U postgres -c "CREATE DATABASE strivpath_test_e2e;"
```

The global setup automatically applies migrations before tests run.

### Using Fixtures

The `auth.fixture.ts` provides ready-to-use authenticated pages:

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('should access protected page when authenticated', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage).toHaveURL(/\/dashboard/);
});
```

Available fixtures:

- **`authenticatedPage`**: Page with authenticated user and cookies set
- **`authenticatedUser`**: User data, tokens, and preferences
- **`db`**: Direct Prisma database access for assertions

### Auth Helpers: Two Approaches

This project provides two authentication methods for E2E tests, each suited for different testing scenarios.

#### `loginViaBackend()` - Direct Authentication

**Use for**: Tests focused on authenticated behavior without testing OAuth flow

**Advantages**:

- Fast execution (no HTTP round-trip)
- Complete control over user state
- Simplified test setup

**Example**:

```typescript
import { loginViaBackend } from '../helpers/auth';

const user = await loginViaBackend(page, {
  username: 'testuser',
  stravaId: 123456,
  onboardingCompleted: true,
});
```

#### `loginViaOAuth()` - Realistic OAuth Flow

**Use for**: Tests validating OAuth integration and cookie handling

**Advantages**:

- Tests real OAuth callback route
- Validates MSW handler behavior
- Realistic browser flow

**Example**:

```typescript
import { loginViaOAuth } from '../helpers/auth';

await loginViaOAuth(page, {
  mockCode: 'test-oauth-code',
  expectedRedirect: /\/en\/onboarding/,
});
```

#### Other Auth Helpers

```typescript
// Logout (calls GraphQL mutation + clears cookies)
await logout(page);

// Wait for auth to be loaded in Apollo cache
await waitForAuth(page);
```

### Database Helpers

```typescript
import { resetDatabase, createTestUser, seedAuthenticatedUser } from '../setup/db-helpers';

// Reset database (truncate all tables)
await resetDatabase();

// Create simple test user
const { user, preferences } = await createTestUser({
  username: 'testuser',
  stravaId: 123456,
});

// Create authenticated user with JWT tokens
const authUser = await seedAuthenticatedUser({
  username: 'authuser',
  onboardingCompleted: true,
});
```

## Writing E2E Tests

### Testing with Authentication

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('should display user info when authenticated', async ({ authenticatedPage, authenticatedUser }) => {
    await authenticatedPage.goto('/dashboard');

    await expect(authenticatedPage.getByText(authenticatedUser.user.firstname)).toBeVisible();
  });
});
```

### Testing Unauthenticated Access

```typescript
import { test as base } from '@playwright/test';
import { resetDatabase } from '../setup/db-helpers';
import { expectUnauthenticated } from '../helpers/auth';

base.beforeEach(async () => {
  await resetDatabase();
});

base('should redirect to login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expectUnauthenticated(page);
});
```

### Testing Page Navigation

```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /strivpath/i })).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /login/i }).click();

    await expect(page).toHaveURL(/.*login/);
  });
});
```

### Testing Forms

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should complete OAuth flow', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /connect with strava/i }).click();

    // Should redirect to Strava OAuth
    await expect(page).toHaveURL(/.*strava.com.*/);
  });
});
```

## Best Practices

1. **Co-locate tests**: Place component tests next to the components they test
2. **Use MSW for API mocking**: Mock GraphQL queries/mutations in component tests
3. **Test user behavior**: Focus on what users see and do, not implementation details
4. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
5. **Wait for async operations**: Use `waitFor` for asynchronous state changes
6. **E2E for critical paths**: Use Playwright for user flows like authentication, checkout, etc.

## MSW (Mock Service Worker)

MSW is configured in `vitest.setup.ts` and runs automatically for all component tests.

**Adding a new GraphQL mock**:

Edit `mocks/handlers.ts`:

```typescript
import { graphql, HttpResponse } from 'msw';

export const handlers = [
  graphql.query('GetUsers', () => {
    return HttpResponse.json({
      data: {
        users: [
          /* mock data */
        ],
      },
    });
  }),

  graphql.mutation('CreateUser', ({ variables }) => {
    return HttpResponse.json({
      data: {
        createUser: {
          id: '1',
          username: variables.username,
        },
      },
    });
  }),
];
```

## Configuration

- **Vitest**: Configured in `vitest.config.ts`
- **Playwright**: Configured in `playwright.config.ts`
- **MSW**: Setup in `mocks/server.ts` and `vitest.setup.ts`

## Running Tests in CI

Tests are configured in Turborepo for parallel execution:

```bash
# From repository root
pnpm test              # Run all tests (unit + component)
pnpm test:e2e          # Run all E2E tests
```

E2E tests automatically start the Next.js dev server via Playwright's `webServer` configuration.
