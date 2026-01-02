import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_GOAL_DETAIL_RUN_50K } from '@/mocks/fixtures/goal.fixture';
import { GoalTargetType, GoalPeriodType } from '@/gql/graphql';
import {
  useCreateGoal,
  useCreateGoalFromTemplate,
  useUpdateGoal,
  useDeleteGoal,
  useArchiveGoal,
} from './use-goal-mutations';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

let testClient: ReturnType<typeof createTestApolloClient>;

const createTestApolloClient = () => {
  const errorLink = new ErrorLink(({ error }) => {
    console.error('[GraphQL error]:', error);
  });

  const httpLink = new HttpLink({
    uri: 'http://localhost:3011/graphql',
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Goal: {
          keyFields: ['id'],
        },
      },
    }),
    link: from([errorLink, httpLink]),
  });
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={testClient}>{children}</ApolloProvider>
  );
};

describe('useCreateGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should create goal successfully', async () => {
    server.use(
      graphql.mutation('CreateGoal', () => {
        return HttpResponse.json({
          data: { createGoal: MOCK_GOAL_DETAIL_RUN_50K },
        });
      }),
    );

    const { result } = renderHook(() => useCreateGoal(), {
      wrapper: createWrapper(),
    });

    const input = {
      title: 'Test Goal',
      targetType: GoalTargetType.Distance,
      targetValue: 50,
      periodType: GoalPeriodType.Monthly,
      startDate: '2025-01-01',
    };

    const goal = await result.current.createGoal(input);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(goal).toBeDefined();
    expect((goal as unknown as { id: string })?.id).toBe((MOCK_GOAL_DETAIL_RUN_50K as unknown as { id: string }).id);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle create error', async () => {
    server.use(
      graphql.mutation('CreateGoal', () => {
        return HttpResponse.json({
          errors: [
            {
              message: 'Validation error',
              extensions: { code: 'VALIDATION_ERROR' },
            },
          ],
          data: null,
        });
      }),
    );

    const { result } = renderHook(() => useCreateGoal(), {
      wrapper: createWrapper(),
    });

    const input = {
      title: 'Test Goal',
      targetType: GoalTargetType.Distance,
      targetValue: 50,
      periodType: GoalPeriodType.Monthly,
      startDate: '2025-01-01',
    };

    const goal = await result.current.createGoal(input);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(goal).toBeNull();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});

describe('useCreateGoalFromTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should create goal from template successfully', async () => {
    server.use(
      graphql.mutation('CreateGoalFromTemplate', () => {
        return HttpResponse.json({
          data: { createGoalFromTemplate: MOCK_GOAL_DETAIL_RUN_50K },
        });
      }),
    );

    const { result } = renderHook(() => useCreateGoalFromTemplate(), {
      wrapper: createWrapper(),
    });

    const input = {
      templateId: 1,
      startDate: '2025-01-01',
    };

    const goal = await result.current.createFromTemplate(input);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(goal).toBeDefined();
    expect(result.current.error).toBeUndefined();
  });
});

describe('useUpdateGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should update goal successfully', async () => {
    const updatedGoal = {
      ...MOCK_GOAL_DETAIL_RUN_50K,
      title: 'Updated Title',
    };

    server.use(
      graphql.mutation('UpdateGoal', () => {
        return HttpResponse.json({
          data: { updateGoal: updatedGoal },
        });
      }),
    );

    const { result } = renderHook(() => useUpdateGoal(), {
      wrapper: createWrapper(),
    });

    const input = {
      title: 'Updated Title',
    };

    const goal = await result.current.updateGoal(1, input);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(goal).toBeDefined();
    expect((goal as unknown as { title: string })?.title).toBe('Updated Title');
    expect(result.current.error).toBeUndefined();
  });
});

describe('useDeleteGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should delete goal successfully', async () => {
    server.use(
      graphql.mutation('DeleteGoal', () => {
        return HttpResponse.json({
          data: { deleteGoal: true },
        });
      }),
    );

    const { result } = renderHook(() => useDeleteGoal(), {
      wrapper: createWrapper(),
    });

    const success = await result.current.deleteGoal(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(success).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle delete error', async () => {
    server.use(
      graphql.mutation('DeleteGoal', () => {
        return HttpResponse.json({
          errors: [
            {
              message: 'Not found',
              extensions: { code: 'NOT_FOUND' },
            },
          ],
          data: null,
        });
      }),
    );

    const { result } = renderHook(() => useDeleteGoal(), {
      wrapper: createWrapper(),
    });

    const success = await result.current.deleteGoal(999);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(success).toBe(false);

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});

describe('useArchiveGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should archive goal successfully', async () => {
    server.use(
      graphql.mutation('ArchiveGoal', () => {
        return HttpResponse.json({
          data: { archiveGoal: MOCK_GOAL_DETAIL_RUN_50K },
        });
      }),
    );

    const { result } = renderHook(() => useArchiveGoal(), {
      wrapper: createWrapper(),
    });

    const goal = await result.current.archiveGoal(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(goal).toBeDefined();
    expect(result.current.error).toBeUndefined();
  });
});
