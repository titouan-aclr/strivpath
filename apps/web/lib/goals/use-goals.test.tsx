import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_GOALS_ARRAY } from '@/mocks/fixtures/goal.fixture';
import { GoalStatus, SportType } from '@/gql/graphql';
import { useGoals } from './use-goals';

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
        Query: {
          fields: {
            goals: {
              keyArgs: ['status', 'sportType', 'includeArchived'],
              merge(_: unknown[], incoming: unknown[]): unknown[] {
                return incoming;
              },
            },
          },
        },
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

describe('useGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching goals', () => {
    it('should fetch goals successfully', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            data: { goals: MOCK_GOALS_ARRAY },
          });
        }),
      );

      const { result } = renderHook(() => useGoals(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goals).toHaveLength(MOCK_GOALS_ARRAY.length);
      expect(result.current.error).toBeUndefined();
    });

    it('should return empty array when no goals', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            data: { goals: [] },
          });
        }),
      );

      const { result } = renderHook(() => useGoals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goals).toEqual([]);
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const activeGoalsOnly = MOCK_GOALS_ARRAY.filter(g => g.status === GoalStatus.Active);

      server.use(
        graphql.query('Goals', ({ variables }) => {
          const status = variables.status;
          const filtered = status ? MOCK_GOALS_ARRAY.filter(g => g.status === status) : MOCK_GOALS_ARRAY;

          return HttpResponse.json({
            data: { goals: filtered },
          });
        }),
      );

      const { result } = renderHook(() => useGoals({ status: GoalStatus.Active }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goals).toHaveLength(activeGoalsOnly.length);
      expect(result.current.goals.every(g => g.status === GoalStatus.Active)).toBe(true);
    });

    it('should filter by sportType', async () => {
      server.use(
        graphql.query('Goals', ({ variables }) => {
          const sportType = variables.sportType;
          const filtered = sportType ? MOCK_GOALS_ARRAY.filter(g => g.sportType === sportType) : MOCK_GOALS_ARRAY;

          return HttpResponse.json({
            data: { goals: filtered },
          });
        }),
      );

      const { result } = renderHook(() => useGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goals.every(g => g.sportType === SportType.Run)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('Goals', () => HttpResponse.error()));

      const { result } = renderHook(() => useGoals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.goals).toEqual([]);
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Unauthorized',
                extensions: { code: 'UNAUTHENTICATED' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useGoals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Refetch', () => {
    it('should refetch goals', async () => {
      const spy = vi.fn();

      server.use(
        graphql.query('Goals', () => {
          spy();
          return HttpResponse.json({
            data: { goals: MOCK_GOALS_ARRAY },
          });
        }),
      );

      const { result } = renderHook(() => useGoals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(spy).toHaveBeenCalledTimes(1);

      await result.current.refetch();

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
