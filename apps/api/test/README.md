# Backend Testing Guide

This directory contains the testing infrastructure for the NestJS GraphQL API.

## Directory Structure

```
test/
├── setup.ts                  # Unit test setup (auto-mock PrismaService)
├── setup-e2e.ts              # E2E test setup (database cleanup)
├── jest-e2e.json             # E2E Jest configuration
├── mocks/                    # Mock factories and utilities
│   ├── prisma.mock.ts        # PrismaService mock utilities
│   └── factories.ts          # Test data factories (Faker.js)
└── helpers/                  # Test helper utilities
    └── graphql-test.helper.ts # GraphQL testing utilities
```

## Test Types

### Unit Tests

Unit tests are located **next to the code** they test:

```
src/
├── user/
│   ├── user.service.ts
│   ├── user.service.spec.ts       ← Unit test
│   ├── user.resolver.ts
│   └── user.resolver.spec.ts      ← Unit test
```

**Naming convention**: `*.spec.ts`

**Run unit tests**:

```bash
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode
pnpm test:cov          # With coverage
```

### E2E Tests

E2E tests are located in the `test/` directory:

```
test/
├── graphql/
│   ├── user.e2e-spec.ts          ← GraphQL query/mutation tests
│   └── auth.e2e-spec.ts          ← Auth flow tests
```

**Naming convention**: `*.e2e-spec.ts`

**Run e2e tests**:

```bash
pnpm test:e2e
```

## Writing Unit Tests

### Testing a Service

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
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { stravaId: 12345 },
    });
  });
});
```

### Testing a Resolver

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { createMockPrismaUser } from '../../test/mocks/factories';
import { UserMapper } from './user.mapper';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn(),
            findByStravaId: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);
  });

  it('should return all users', async () => {
    const mockPrismaUsers = [createMockPrismaUser()];
    const expectedGraphQLUsers = mockPrismaUsers.map(UserMapper.toGraphQL);

    jest.spyOn(userService, 'findAll').mockResolvedValue(mockPrismaUsers);

    const result = await resolver.users();

    expect(result).toEqual(expectedGraphQLUsers);
  });
});
```

## Writing E2E Tests

### Testing GraphQL Queries

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/database/prisma.service';
import { createMockPrismaUser } from '../mocks/factories';

describe('User GraphQL (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should query all users', async () => {
    const mockUser = createMockPrismaUser();
    await prisma.user.create({ data: mockUser });

    const query = `
      query {
        users {
          id
          stravaId
          username
        }
      }
    `;

    const response = await request(app.getHttpServer()).post('/graphql').send({ query }).expect(200);

    expect(response.body.data.users).toBeDefined();
    expect(response.body.data.users.length).toBeGreaterThan(0);
  });
});
```

## Best Practices

1. **Use factories for test data**: Always use `factories.ts` to generate test data
2. **Mock external dependencies**: Use `createMockPrismaService()` for database mocking
3. **Test business logic, not implementation**: Focus on behavior, not internal details
4. **Arrange-Act-Assert pattern**: Structure tests clearly
5. **One assertion per test**: Keep tests focused and atomic
6. **Descriptive test names**: Use `it('should...')` format

## Configuration

- **Unit tests**: Configured in `jest.config.ts` at the root
- **E2E tests**: Configured in `test/jest-e2e.json`
- **Path aliases**: Use `@/` to import from `src/`

## Database for E2E Tests

E2E tests use the same PostgreSQL database configured in `.env`, but **all tables are truncated** before each test via `setup-e2e.ts`.

For isolated testing, consider using a separate test database by creating a `.env.test` file.
