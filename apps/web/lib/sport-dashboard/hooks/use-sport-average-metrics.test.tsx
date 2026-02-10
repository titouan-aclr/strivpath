import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_SPORT_AVERAGE_METRICS } from '@/mocks/fixtures/sport-dashboard.fixture';
import { SportType, StatisticsPeriod } from '@/gql/graphql';
import { useSportAverageMetrics } from './use-sport-average-metrics';
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
    cache: new InMemoryCache(),
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

describe('useSportAverageMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching average metrics', () => {
    it('should fetch average metrics successfully with default period', async () => {
      server.use(
        graphql.query('SportAverageMetrics', ({ variables }) => {
          const sportType = variables.sportType as SportType;
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[sportType] },
          });
        }),
      );

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.period).toBe(StatisticsPeriod.Month);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toEqual(MOCK_SPORT_AVERAGE_METRICS[SportType.Run]);
      expect(result.current.error).toBeUndefined();
    });

    it('should use initial period when provided', async () => {
      server.use(
        graphql.query('SportAverageMetrics', ({ variables }) => {
          expect(variables.period).toBe(StatisticsPeriod.Year);
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(
        () => useSportAverageMetrics({ sportType: SportType.Run, initialPeriod: StatisticsPeriod.Year }),
        { wrapper: createWrapper() },
      );

      expect(result.current.period).toBe(StatisticsPeriod.Year);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should return null metrics when no data', async () => {
      server.use(
        graphql.query('SportAverageMetrics', () => {
          return HttpResponse.json({
            data: { sportAverageMetrics: null },
          });
        }),
      );

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toBeNull();
    });
  });

  describe('Sport-specific metrics', () => {
    it('should return pace and no speed for Run sport', async () => {
      server.use(
        graphql.query('SportAverageMetrics', () => {
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics?.averagePace).toBeDefined();
      expect(result.current.metrics?.averageSpeed).toBeNull();
      expect(result.current.metrics?.averagePower).toBeNull();
    });

    it('should return speed and power for Ride sport', async () => {
      server.use(
        graphql.query('SportAverageMetrics', () => {
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Ride] },
          });
        }),
      );

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Ride }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics?.averageSpeed).toBeDefined();
      expect(result.current.metrics?.averagePower).toBeDefined();
      expect(result.current.metrics?.averagePace).toBeNull();
    });
  });

  describe('Period changes', () => {
    it('should refetch when period changes', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('SportAverageMetrics', ({ variables }) => {
          querySpy(variables.period);
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(querySpy).toHaveBeenCalledWith(StatisticsPeriod.Month);

      act(() => {
        result.current.setPeriod(StatisticsPeriod.Week);
      });

      await waitFor(() => {
        expect(querySpy).toHaveBeenCalledWith(StatisticsPeriod.Week);
      });

      expect(result.current.period).toBe(StatisticsPeriod.Week);
    });
  });

  describe('Skip behavior', () => {
    it('should not fetch when skip is true', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('SportAverageMetrics', () => {
          querySpy();
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run, skip: true }), {
        wrapper: createWrapper(),
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(querySpy).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('SportAverageMetrics', () => HttpResponse.error()));

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.metrics).toBeNull();
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.query('SportAverageMetrics', () => {
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

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Refetch', () => {
    it('should refetch data when refetch is called', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('SportAverageMetrics', () => {
          querySpy();
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => useSportAverageMetrics({ sportType: SportType.Run }), {
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
});
