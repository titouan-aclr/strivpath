import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_SPORT_PERIOD_STATISTICS } from '@/mocks/fixtures/sport-dashboard.fixture';
import { SportType, StatisticsPeriod } from '@/gql/graphql';
import { useSportStats } from './use-sport-stats';
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

describe('useSportStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching statistics', () => {
    it('should fetch statistics successfully with default period', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', ({ variables }) => {
          const sportType = variables.sportType as SportType;
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[sportType] },
          });
        }),
      );

      const { result } = renderHook(() => useSportStats({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.period).toBe(StatisticsPeriod.Month);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(MOCK_SPORT_PERIOD_STATISTICS[SportType.Run]);
      expect(result.current.error).toBeUndefined();
    });

    it('should use initial period when provided', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', ({ variables }) => {
          expect(variables.period).toBe(StatisticsPeriod.Week);
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(
        () => useSportStats({ sportType: SportType.Run, initialPeriod: StatisticsPeriod.Week }),
        { wrapper: createWrapper() },
      );

      expect(result.current.period).toBe(StatisticsPeriod.Week);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should return null stats when no data', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', () => {
          return HttpResponse.json({
            data: { sportPeriodStatistics: null },
          });
        }),
      );

      const { result } = renderHook(() => useSportStats({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBeNull();
    });
  });

  describe('Period changes', () => {
    it('should refetch when period changes', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('SportPeriodStatistics', ({ variables }) => {
          querySpy(variables.period);
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => useSportStats({ sportType: SportType.Run }), {
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
        graphql.query('SportPeriodStatistics', () => {
          querySpy();
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => useSportStats({ sportType: SportType.Run, skip: true }), {
        wrapper: createWrapper(),
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(querySpy).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.stats).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('SportPeriodStatistics', () => HttpResponse.error()));

      const { result } = renderHook(() => useSportStats({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.stats).toBeNull();
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', () => {
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

      const { result } = renderHook(() => useSportStats({ sportType: SportType.Run }), {
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
        graphql.query('SportPeriodStatistics', () => {
          querySpy();
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => useSportStats({ sportType: SportType.Run }), {
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

  describe('Different sports', () => {
    it('should fetch correct data for each sport type', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', ({ variables }) => {
          const sportType = variables.sportType as SportType;
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[sportType] },
          });
        }),
      );

      const { result: runResult } = renderHook(() => useSportStats({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(runResult.current.loading).toBe(false);
      });

      expect(runResult.current.stats?.totalDistance).toBe(MOCK_SPORT_PERIOD_STATISTICS[SportType.Run].totalDistance);

      testClient = createTestApolloClient();

      const { result: rideResult } = renderHook(() => useSportStats({ sportType: SportType.Ride }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(rideResult.current.loading).toBe(false);
      });

      expect(rideResult.current.stats?.totalDistance).toBe(MOCK_SPORT_PERIOD_STATISTICS[SportType.Ride].totalDistance);
    });
  });
});
