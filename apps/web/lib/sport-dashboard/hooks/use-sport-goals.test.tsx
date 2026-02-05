import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_GOAL_CARD_RUN_50K } from '@/mocks/fixtures/goal.fixture';
import { SportType, GoalStatus } from '@/gql/graphql';
import { useSportGoals } from './use-sport-goals';
import type { ReactNode } from 'react';

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
  return ({ children }: { children: ReactNode }) => <ApolloProvider client={testClient}>{children}</ApolloProvider>;
};

const MOCK_RUN_GOALS = [
  MOCK_GOAL_CARD_RUN_50K,
  { ...MOCK_GOAL_CARD_RUN_50K, id: '10', title: 'Second Run Goal' },
  { ...MOCK_GOAL_CARD_RUN_50K, id: '11', title: 'Third Run Goal' },
  { ...MOCK_GOAL_CARD_RUN_50K, id: '12', title: 'Fourth Run Goal' },
];

describe('useSportGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching goals', () => {
    it('should fetch goals for a specific sport', async () => {
      server.use(
        graphql.query('Goals', ({ variables }) => {
          expect(variables.sportType).toBe(SportType.Run);
          expect(variables.status).toBe(GoalStatus.Active);
          return HttpResponse.json({
            data: { goals: MOCK_RUN_GOALS },
          });
        }),
      );

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasGoals).toBe(true);
      expect(result.current.error).toBeUndefined();
    });

    it('should correctly identify primary goal', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            data: { goals: MOCK_RUN_GOALS },
          });
        }),
      );

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.primaryGoal).not.toBeNull();
      expect(result.current.primaryGoal?.id).toBe(MOCK_RUN_GOALS[0].id);
    });

    it('should limit secondary goals to 2', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            data: { goals: MOCK_RUN_GOALS },
          });
        }),
      );

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.secondaryGoals.length).toBe(2);
      expect(result.current.secondaryGoals[0].id).toBe(MOCK_RUN_GOALS[1].id);
      expect(result.current.secondaryGoals[1].id).toBe(MOCK_RUN_GOALS[2].id);
    });
  });

  describe('Empty states', () => {
    it('should handle no goals', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            data: { goals: [] },
          });
        }),
      );

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasGoals).toBe(false);
      expect(result.current.primaryGoal).toBeNull();
      expect(result.current.secondaryGoals).toEqual([]);
    });

    it('should handle single goal (no secondary)', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            data: { goals: [MOCK_GOAL_CARD_RUN_50K] },
          });
        }),
      );

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasGoals).toBe(true);
      expect(result.current.primaryGoal).not.toBeNull();
      expect(result.current.secondaryGoals).toEqual([]);
    });

    it('should handle two goals (one secondary)', async () => {
      server.use(
        graphql.query('Goals', () => {
          return HttpResponse.json({
            data: { goals: MOCK_RUN_GOALS.slice(0, 2) },
          });
        }),
      );

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasGoals).toBe(true);
      expect(result.current.primaryGoal).not.toBeNull();
      expect(result.current.secondaryGoals.length).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('Goals', () => HttpResponse.error()));

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.hasGoals).toBe(false);
      expect(result.current.primaryGoal).toBeNull();
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

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Refetch', () => {
    it('should refetch goals when refetch is called', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('Goals', () => {
          querySpy();
          return HttpResponse.json({
            data: { goals: MOCK_RUN_GOALS },
          });
        }),
      );

      const { result } = renderHook(() => useSportGoals({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(querySpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(querySpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sport filtering', () => {
    it('should only fetch active goals for specified sport', async () => {
      const variablesSpy = vi.fn();

      server.use(
        graphql.query('Goals', ({ variables }) => {
          variablesSpy(variables);
          return HttpResponse.json({
            data: { goals: [] },
          });
        }),
      );

      renderHook(() => useSportGoals({ sportType: SportType.Ride }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(variablesSpy).toHaveBeenCalled();
      });

      expect(variablesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sportType: SportType.Ride,
          status: GoalStatus.Active,
        }),
      );
    });
  });
});
