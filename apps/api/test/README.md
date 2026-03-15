# Backend Testing Guide

This directory contains the testing infrastructure for the NestJS GraphQL API.

## Directory Structure

```
test/
├── setup.ts                    # Unit test global setup (auto-mocks PrismaService)
├── setup-e2e.ts                # E2E test setup (PostgreSQL truncation before each test)
├── setup-integration.ts        # Integration test setup (dedicated test database)
├── test-db.ts                  # Test database utilities (seed helpers, Prisma client)
├── jest-e2e.json               # E2E Jest configuration
├── mocks/
│   ├── prisma.mock.ts          # MockPrismaService type + createMockPrismaService()
│   └── factories.ts            # Faker.js test data factories
├── helpers/
│   └── graphql-test.helper.ts  # NestJS GraphQL testing utilities
└── integration/
    ├── auth-flow.integration.spec.ts
    ├── auth-graphql.integration.spec.ts
    ├── auth-oauth-callback.integration.spec.ts
    ├── activity-detail-fetch.integration.spec.ts
    ├── activity-sync.integration.spec.ts
    ├── goal-auto-update.integration.spec.ts
    ├── goal-recurring.integration.spec.ts
    ├── goal-template.integration.spec.ts
    └── user-preferences.integration.spec.ts
```

---

## Test Types

### Unit Tests

Unit tests are co-located with the source files they test:

```
src/
├── goal/
│   ├── goal.service.ts
│   ├── goal.service.spec.ts         ← Unit test
│   ├── goal.resolver.ts
│   └── goal.resolver.spec.ts        ← Unit test
```

**Naming convention**: `*.spec.ts`

**Run**:

```bash
pnpm test                  # Run all unit tests
pnpm test:watch            # Watch mode
pnpm test:cov              # With coverage report
```

Coverage thresholds enforced: 85% lines/statements · 75% branches/functions.

---

### Integration Tests

Integration tests verify interactions between services against a real PostgreSQL database (`strivpath_test`). 9 test files cover auth flows, activity sync, goal logic, templates, and user preferences.

**Naming convention**: `*.integration.spec.ts`

**Run**:

```bash
pnpm test:integration          # Run all integration tests
pnpm test:integration:watch    # Watch mode
```

For setup instructions, database configuration, debugging, and the full list of test files, see [`test/integration/README.md`](integration/README.md).

---

### E2E Tests

E2E tests cover full HTTP request cycles using Supertest. Located at the root of `test/`.

**Naming convention**: `*.e2e-spec.ts`

**Run**:

```bash
pnpm test:e2e
```

| File                             | What it covers                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `auth.e2e-spec.ts`               | `stravaAuthUrl` query, unauthenticated access rejection                        |
| `auth-throttling.e2e-spec.ts`    | Rate limiting enforcement on auth endpoints                                    |
| `goal.e2e-spec.ts`               | Goal creation and retrieval via GraphQL                                        |
| `goal-authenticated.e2e-spec.ts` | Full goal lifecycle for authenticated users (create, update, delete, progress) |
| `user-preferences.e2e-spec.ts`   | `updateUserPreferences` mutation, sport selection via GraphQL                  |

---

## Writing Unit Tests

PrismaService is auto-mocked globally via `test/setup.ts`. Inject mock implementations inline using `jest.fn()`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { GoalService } from './goal.service';
import { PrismaService } from '@/database/prisma.service';

describe('GoalService', () => {
  let service: GoalService;
  let prisma: PrismaService;

  const mockPrismaService = {
    goal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoalService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<GoalService>(GoalService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return goals for a user', async () => {
    const mockGoal = { id: 1, userId: 1, title: 'Run 100km', status: 'ACTIVE' };
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    const result = await service.findAllForUser(1);

    expect(result).toHaveLength(1);
    expect(prisma.goal.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
  });
});
```

### Test Data Factories

Use the factories in `test/mocks/factories.ts` to generate consistent, randomized test data:

```typescript
import {
  createMockPrismaUser,
  createMockPrismaActivity,
  createMockPrismaSyncHistory,
} from '../../test/mocks/factories';

const user = createMockPrismaUser({ stravaId: 12345 });
const activity = createMockPrismaActivity({ userId: user.id, type: 'Run' });
const syncHistory = createMockPrismaSyncHistory({ userId: user.id });
```

Available factories: `createMockPrismaUser` · `createMockStravaToken` · `createMockPrismaUserPreferences` · `createMockPrismaActivity` · `createMockPrismaSyncHistory`.

---

## Writing Integration Tests

Integration tests load the full `AppModule` against a dedicated `strivpath_test` database. The database is automatically reset between tests via `test/setup-integration.ts`.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { getTestPrismaClient, seedTestUser } from '../test-db';

describe('Goal Auto-Update Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update goal progress after activity sync', async () => {
    const prisma = getTestPrismaClient();
    const { user } = await seedTestUser({ stravaId: 99999 });

    // ... test against real database
    const goals = await prisma.goal.findMany({ where: { userId: user.id } });
    expect(goals).toBeDefined();
  });
});
```

Always mock external Strava API calls to avoid real HTTP requests and rate limits.

---

## Writing E2E Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a Strava OAuth URL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { stravaAuthUrl }` })
      .expect(200);

    expect(response.body.data.stravaAuthUrl).toContain('strava.com/oauth/authorize');
  });
});
```

---

## Configuration

| Config file                  | Test type   | File match                                  |
| ---------------------------- | ----------- | ------------------------------------------- |
| `jest.config.ts`             | Unit        | `src/**/*.spec.ts`                          |
| `jest.integration.config.ts` | Integration | `test/integration/**/*.integration.spec.ts` |
| `test/jest-e2e.json`         | E2E         | `test/**/*.e2e-spec.ts`                     |

Integration and E2E configs run with `maxWorkers: 1` to avoid database conflicts.

## Database

- **Unit tests**: PrismaService auto-mocked via `test/setup.ts` — no database needed
- **Integration tests**: `strivpath_test` database — created and migrated automatically by `test/setup-integration.ts`
- **E2E tests**: Same `strivpath_test` database — all tables truncated before each test via `test/setup-e2e.ts`

## Best Practices

1. **Unit tests**: Mock all dependencies inline with `jest.fn()` — isolate one service per test file
2. **Integration tests**: Use `seedTestUser()` and helpers from `test-db.ts` for initial data setup
3. **Mock Strava API**: Never make real HTTP calls to Strava — mock all `StravaService` methods
4. **Arrange-Act-Assert**: Structure each test in three clear phases
5. **Descriptive names**: Use `it('should...')` format with a full sentence
6. **One behavior per test**: Keep each test focused on a single outcome
