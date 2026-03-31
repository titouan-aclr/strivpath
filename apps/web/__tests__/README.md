# Frontend Testing Guide

This directory contains E2E tests using Playwright for the Next.js application.

For unit and component tests (Vitest), see the `*.test.ts` / `*.test.tsx` files co-located with the source.

## Directory Structure

```
apps/web/
├── __tests__/                        # E2E tests (Playwright)
│   ├── auth/
│   │   ├── auth-flow.spec.ts         # Auth setup, cookie validation, token persistence
│   │   └── smoke.spec.ts             # Infrastructure and environment validation
│   ├── fixtures/
│   │   ├── auth.fixture.ts           # Playwright fixtures (db, authenticatedUser, authenticatedPage)
│   │   └── test-data.ts              # Predefined test users and URLs
│   ├── helpers/
│   │   ├── auth.ts                   # loginViaBackend, loginViaOAuth, logout, waitForAuth
│   │   └── cookies.ts                # setAuthCookies, getAuthCookies, clearAuthCookies
│   └── setup/
│       ├── global-setup.ts           # Migrations before all tests
│       ├── global-teardown.ts        # Cleanup after all tests
│       ├── db-helpers.ts             # resetDatabase, createTestUser, seedAuthenticatedUser
│       ├── msw-server.ts             # MSW HTTP handlers for OAuth callback mock
│       └── prisma-client.ts          # Prisma client for E2E test database
├── components/
│   └── **/*.test.tsx                 # Component tests (Vitest + Testing Library)
├── lib/
│   └── **/*.test.ts                  # Utility and hook tests (Vitest)
├── mocks/
│   ├── handlers.ts                   # MSW GraphQL handlers (CurrentUser, Activities, Goals, …)
│   └── server.ts                     # MSW server setup for Vitest
├── vitest.config.mts                 # Vitest configuration
├── vitest.setup.ts                   # Global Vitest setup (MSW, polyfills)
└── playwright.config.ts              # Playwright configuration
```

---

## Test Types

### Unit & Component Tests (Vitest)

Tests are co-located with the source files they test:

```
app/[locale]/(dashboard)/goals/
├── goals-page-content.tsx
└── goals-page-content.test.tsx       ← Component test

lib/sync/
├── context.tsx
└── context.test.tsx                  ← Hook/context test
```

**Naming convention**: `*.test.ts` or `*.test.tsx`

**Run**:

```bash
pnpm test              # Run all unit/component tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Interactive Vitest UI
pnpm test:cov          # With coverage report
```

### E2E Tests (Playwright)

Located in `__tests__/`. Tests run against a real running API and a dedicated E2E database (`strivpath_test_e2e`).

**Naming convention**: `*.spec.ts`

**Run**:

```bash
pnpm test:e2e          # Run all E2E tests (headless)
pnpm test:e2e:ui       # Interactive Playwright UI
```

---

## Writing Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { GoalCard } from './goal-card';
import { useGoals } from '@/lib/goals/use-goals';
import messages from '@/messages/en.json';

vi.mock('@/lib/goals/use-goals');

describe('GoalCard', () => {
  it('renders goal title and progress', async () => {
    vi.mocked(useGoals).mockReturnValue({
      goals: [{ id: 1, title: 'Run 100km', progressPercentage: 45 }],
      loading: false,
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GoalCard goalId={1} />
      </NextIntlClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Run 100km')).toBeInTheDocument();
    });
  });
});
```

### Testing with GraphQL Mocks (MSW)

MSW is configured globally in `vitest.setup.ts` and active for all component tests. Override handlers per test when needed:

```typescript
import { graphql, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

beforeEach(() => {
  server.use(
    graphql.query('Goals', () =>
      HttpResponse.json({
        data: {
          goals: [{ id: 1, title: 'Run 100km', status: 'ACTIVE' }],
        },
      }),
    ),
  );
});
```

Existing MSW handler operation names: `CurrentUser`, `RefreshToken`, `Logout`, `SyncActivities`, `SyncStatus`, `Activities`, `Goals`, `ActiveGoals`, and others defined in `mocks/handlers.ts`.

---

## Writing E2E Tests

### With Authentication Fixtures

The `auth.fixture.ts` provides ready-to-use authenticated pages via Playwright fixtures:

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('displays user name when authenticated', async ({ authenticatedPage, authenticatedUser }) => {
    await authenticatedPage.goto('/dashboard');

    await expect(authenticatedPage.getByText(authenticatedUser.user.firstname)).toBeVisible();
  });
});
```

**Available fixtures**:

| Fixture             | Type                    | Description                               |
| ------------------- | ----------------------- | ----------------------------------------- |
| `db`                | `PrismaClient`          | Direct database access for assertions     |
| `authenticatedUser` | `AuthenticatedTestUser` | User data, tokens, and preferences        |
| `authenticatedPage` | `Page`                  | Playwright page with auth cookies pre-set |

### Without Authentication

```typescript
import { test as base, expect } from '@playwright/test';
import { resetDatabase } from '../setup/db-helpers';
import { expectUnauthenticated } from '../helpers/auth';

base.beforeEach(async () => {
  await resetDatabase();
});

base('redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expectUnauthenticated(page);
});
```

---

## Auth Helpers (`helpers/auth.ts`)

Two authentication approaches for different test scenarios:

### `loginViaBackend(page, options?)` — Direct Authentication

Creates a user in the database and injects auth cookies directly. Fast and deterministic.

```typescript
import { loginViaBackend } from '../helpers/auth';

const user = await loginViaBackend(page, {
  stravaId: 123456,
  username: 'testathlete',
  onboardingCompleted: true,
});
```

**Use for**: Tests focused on authenticated behavior (dashboard, goals, settings).

### `loginViaOAuth(page, options?)` — OAuth Flow

Navigates through the OAuth callback route with MSW mocking the Strava endpoint.

```typescript
import { loginViaOAuth } from '../helpers/auth';

await loginViaOAuth(page, {
  mockCode: 'test-oauth-code',
  expectedRedirect: /\/en\/onboarding/,
});
```

**Use for**: Tests validating the OAuth callback, cookie setting, and post-auth redirects.

### Other helpers

```typescript
await logout(page);                        // GraphQL logout mutation + clear cookies
await waitForAuth(page);                   // Wait for Apollo cache to populate
await expectUnauthenticated(page);         // Assert page is on /login
await expectAuthenticated(page, url?);     // Assert page is NOT on /login
await waitForGraphQL(page, 'CurrentUser'); // Wait for a specific GraphQL operation
```

---

## Database Helpers (`setup/db-helpers.ts`)

```typescript
import { resetDatabase, createTestUser, seedAuthenticatedUser } from '../setup/db-helpers';

// Truncate all tables and reset sequences
await resetDatabase();

// Create a user with default preferences (no tokens)
const { user, preferences } = await createTestUser({
  stravaId: 123456,
  username: 'testuser',
});

// Create a user with valid JWT access and refresh tokens
const authUser = await seedAuthenticatedUser({
  stravaId: 987654,
  username: 'authuser',
  onboardingCompleted: true,
});
// authUser: { user, preferences, accessToken, refreshToken, refreshTokenJti }
```

---

## Test Data (`fixtures/test-data.ts`)

Predefined users for common scenarios:

```typescript
import { TEST_USERS } from '../fixtures/test-data';

// TEST_USERS.default    — stravaId: 123456789, onboardingCompleted: false
// TEST_USERS.onboarded  — stravaId: 987654321, onboardingCompleted: true
// TEST_USERS.newUser    — stravaId: 111222333, onboardingCompleted: false
```

---

## E2E Database Setup

E2E tests use a dedicated database `strivpath_test_e2e`, separate from the development database.

Run the following once before running E2E tests for the first time:

```bash
# Install Playwright browsers
pnpm exec playwright install

# Create the E2E database
docker exec strivpath-postgres psql -U postgres -c "CREATE DATABASE strivpath_test_e2e;"
```

The global setup (`setup/global-setup.ts`) automatically applies Prisma migrations before the test suite starts.

---

## Configuration

| Config file            | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `vitest.config.mts`    | Vitest setup — jsdom environment, excludes `__tests__/`   |
| `vitest.setup.ts`      | Global Vitest setup — MSW server, polyfills, cleanup      |
| `playwright.config.ts` | Playwright setup — base URL, E2E database URL, web server |

---

## Best Practices

1. **Co-locate tests**: Place component/unit tests next to the files they test
2. **Use MSW for GraphQL mocking**: Override handlers per-test rather than creating custom mocks
3. **Use semantic queries**: Prefer `getByRole`, `getByLabelText`, `getByText` over `getByTestId`
4. **Wait for async operations**: Use `waitFor` for asynchronous rendering or data fetching
5. **E2E for critical paths**: Use Playwright for complete user journeys — auth, onboarding, goal creation
6. **Reset database between E2E tests**: Call `resetDatabase()` in `beforeEach` for clean isolation
