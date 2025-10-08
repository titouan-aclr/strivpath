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
    expect(screen.getByRole('heading', { name: /stravanalytics/i })).toBeInTheDocument();
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

## Writing E2E Tests

### Testing Page Navigation

```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /stravanalytics/i })).toBeVisible();
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
