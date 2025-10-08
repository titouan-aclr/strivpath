# Testing Guide

This document provides an overview of the testing infrastructure for the Stravanalytics monorepo.

## Overview

The project uses different testing tools for backend and frontend:

- **Backend (NestJS API)**: Jest for unit and E2E tests
- **Frontend (Next.js)**: Vitest for unit/component tests, Playwright for E2E tests

## Quick Start

### Run All Tests

```bash
# From repository root
pnpm test              # Run all unit and component tests
pnpm test:e2e          # Run all E2E tests
```

### Run Tests for Specific Package

```bash
# Backend API tests
pnpm --filter api test              # Unit tests
pnpm --filter api test:watch        # Watch mode
pnpm --filter api test:cov          # With coverage
pnpm --filter api test:e2e          # E2E tests

# Frontend web tests
pnpm --filter web test              # Unit/component tests
pnpm --filter web test:watch        # Watch mode
pnpm --filter web test:ui           # Interactive UI
pnpm --filter web test:cov          # With coverage
pnpm --filter web test:e2e          # E2E tests (Playwright)
pnpm --filter web test:e2e:ui       # E2E interactive UI
```

## Backend Testing (NestJS)

### Stack

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertions for GraphQL endpoints
- **jest-mock-extended**: Type-safe mocking for PrismaService

### Structure

```
apps/api/
├── src/
│   ├── user/
│   │   ├── user.service.ts
│   │   ├── user.service.spec.ts        ← Unit test
│   │   ├── user.resolver.ts
│   │   └── user.resolver.spec.ts       ← Unit test
├── test/
│   ├── setup.ts                        ← Unit test setup
│   ├── setup-e2e.ts                    ← E2E test setup
│   ├── jest-e2e.json                   ← E2E config
│   ├── mocks/
│   │   ├── prisma.mock.ts              ← PrismaService mock
│   │   └── factories.ts                ← Test data factories
│   └── helpers/
│       └── graphql-test.helper.ts      ← GraphQL test utilities
└── jest.config.ts                      ← Jest configuration
```

### Example Unit Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '@/database/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/mocks/prisma.mock';
import { createMockPrismaUser } from '../../test/mocks/factories';

describe('UserService', () => {
  let service: UserService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
  });

  it('should find user by stravaId', async () => {
    const mockUser = createMockPrismaUser({ stravaId: 12345 });
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.findByStravaId(12345);

    expect(result).toEqual(mockUser);
  });
});
```

See `apps/api/test/README.md` for detailed backend testing guide.

## Frontend Testing (Next.js)

### Stack

- **Vitest**: Fast test runner with native ESM support
- **@testing-library/react**: Component testing utilities
- **Playwright**: E2E browser testing
- **MSW (Mock Service Worker)**: GraphQL API mocking

### Structure

```
apps/web/
├── app/
│   ├── page.tsx
│   └── page.test.tsx                   ← Component test
├── lib/
│   └── apollo-client.test.ts           ← Unit test
├── __tests__/
│   └── home.spec.ts                    ← E2E test (Playwright)
├── mocks/
│   ├── handlers.ts                     ← MSW GraphQL handlers
│   └── server.ts                       ← MSW server setup
├── vitest.config.ts                    ← Vitest config
├── vitest.setup.ts                     ← Test setup
└── playwright.config.ts                ← Playwright config
```

### Example Component Test

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
              { id: '1', username: 'john_doe', firstname: 'John' },
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

See `apps/web/__tests__/README.md` for detailed frontend testing guide.

## Test Conventions

### Naming

- **Unit tests**: `*.spec.ts` (backend) or `*.test.ts` (frontend)
- **E2E tests**: `*.e2e-spec.ts` (backend) or `*.spec.ts` in `__tests__/` (frontend)

### Location

- **Unit tests**: Co-located with source files
- **E2E tests**: In dedicated `test/` (backend) or `__tests__/` (frontend) directories

### Structure

Use the **Arrange-Act-Assert** pattern:

```typescript
it('should return user by stravaId', async () => {
  // Arrange
  const mockUser = createMockPrismaUser({ stravaId: 12345 });
  prisma.user.findUnique.mockResolvedValue(mockUser);

  // Act
  const result = await service.findByStravaId(12345);

  // Assert
  expect(result).toEqual(mockUser);
});
```

## Turborepo Configuration

Tests are configured in `turbo.json` for optimized caching:

```json
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"]
  },
  "test:e2e": {
    "dependsOn": ["^build"],
    "cache": false
  }
}
```

- **Unit tests**: Cached based on source code changes
- **E2E tests**: Not cached (non-deterministic, require running servers)

## Best Practices

1. **Write tests alongside features**: Don't wait until the end
2. **Test behavior, not implementation**: Focus on what users see and do
3. **Use factories for test data**: `createMockPrismaUser()` instead of manual objects
4. **Mock external dependencies**: Database, APIs, third-party services
5. **Keep tests fast**: Unit tests should run in milliseconds
6. **Use E2E sparingly**: Reserve for critical user flows
7. **Run tests in CI**: Integrate with GitHub Actions or equivalent

## Coverage

Generate coverage reports:

```bash
# Backend
pnpm --filter api test:cov

# Frontend
pnpm --filter web test:cov
```

Coverage reports are generated in `coverage/` directories.

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:e2e
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
