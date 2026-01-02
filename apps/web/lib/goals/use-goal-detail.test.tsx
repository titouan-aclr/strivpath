import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_GOAL_DETAIL_RUN_50K } from '@/mocks/fixtures/goal.fixture';
import { useGoalDetail } from './use-goal-detail';

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
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={testClient}>{children}</ApolloProvider>
  );
};

describe('useGoalDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching goal detail', () => {
    it('should fetch goal detail successfully', async () => {
      server.use(
        graphql.query('Goal', () => {
          return HttpResponse.json({
            data: { goal: MOCK_GOAL_DETAIL_RUN_50K },
          });
        }),
      );

      const { result } = renderHook(() => useGoalDetail({ id: 1 }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goal).toBeDefined();
      expect((result.current.goal as unknown as { id: string })?.id).toBe(
        (MOCK_GOAL_DETAIL_RUN_50K as unknown as { id: string }).id,
      );
      expect(result.current.error).toBeUndefined();
    });

    it('should return null when goal not found', async () => {
      server.use(
        graphql.query('Goal', () => {
          return HttpResponse.json({
            data: { goal: null },
          });
        }),
      );

      const { result } = renderHook(() => useGoalDetail({ id: 999 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goal).toBeNull();
    });

    it('should skip query if id is invalid', () => {
      const { result } = renderHook(() => useGoalDetail({ id: -1 }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.goal).toBeNull();
    });
  });

  describe('Refresh progress', () => {
    it('should refresh goal progress successfully', async () => {
      const updatedGoal = {
        ...MOCK_GOAL_DETAIL_RUN_50K,
        currentValue: 30,
        progressPercentage: 60,
      };

      server.use(
        graphql.query('Goal', () => {
          return HttpResponse.json({
            data: { goal: MOCK_GOAL_DETAIL_RUN_50K },
          });
        }),
        graphql.mutation('RefreshGoalProgress', () => {
          return HttpResponse.json({
            data: { refreshGoalProgress: updatedGoal },
          });
        }),
      );

      const { result } = renderHook(() => useGoalDetail({ id: 1 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect((result.current.goal as unknown as { currentValue: number })?.currentValue).toBe(
        (MOCK_GOAL_DETAIL_RUN_50K as unknown as { currentValue: number }).currentValue,
      );

      await result.current.refreshProgress();

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(result.current.refreshError).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle query error', async () => {
      server.use(
        graphql.query('Goal', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Goal not found',
                extensions: { code: 'NOT_FOUND' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useGoalDetail({ id: 1 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle refresh error', async () => {
      server.use(
        graphql.query('Goal', () => {
          return HttpResponse.json({
            data: { goal: MOCK_GOAL_DETAIL_RUN_50K },
          });
        }),
        graphql.mutation('RefreshGoalProgress', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Failed to refresh progress',
                extensions: { code: 'INTERNAL_ERROR' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useGoalDetail({ id: 1 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      try {
        await result.current.refreshProgress();
      } catch {
        // Expected error from mutation
      }

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.refreshError).toBeDefined();
      });
    });
  });
});
