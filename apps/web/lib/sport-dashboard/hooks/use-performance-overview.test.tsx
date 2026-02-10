import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_SPORT_PERIOD_STATISTICS, MOCK_SPORT_AVERAGE_METRICS } from '@/mocks/fixtures/sport-dashboard.fixture';
import { SportType, StatisticsPeriod } from '@/gql/graphql';
import { usePerformanceOverview } from './use-performance-overview';
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

const setupBothHandlers = (sportType?: SportType) => {
  server.use(
    graphql.query('SportPeriodStatistics', ({ variables }) => {
      const sport = (sportType ?? variables.sportType) as SportType;
      return HttpResponse.json({
        data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[sport] },
      });
    }),
    graphql.query('SportAverageMetrics', ({ variables }) => {
      const sport = (sportType ?? variables.sportType) as SportType;
      return HttpResponse.json({
        data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[sport] },
      });
    }),
  );
};

describe('usePerformanceOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Initial fetch', () => {
    it('should fetch both stats and metrics successfully', async () => {
      setupBothHandlers();

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.period).toBe(StatisticsPeriod.Month);

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
        expect(result.current.metricsLoading).toBe(false);
      });

      expect(result.current.stats).toEqual(MOCK_SPORT_PERIOD_STATISTICS[SportType.Run]);
      expect(result.current.metrics).toEqual(MOCK_SPORT_AVERAGE_METRICS[SportType.Run]);
      expect(result.current.error).toBeUndefined();
    });

    it('should use initial period when provided', async () => {
      const statsSpy = vi.fn();
      const metricsSpy = vi.fn();

      server.use(
        graphql.query('SportPeriodStatistics', ({ variables }) => {
          statsSpy(variables.period);
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
        graphql.query('SportAverageMetrics', ({ variables }) => {
          metricsSpy(variables.period);
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(
        () => usePerformanceOverview({ sportType: SportType.Run, initialPeriod: StatisticsPeriod.Year }),
        { wrapper: createWrapper() },
      );

      expect(result.current.period).toBe(StatisticsPeriod.Year);

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
      });

      expect(statsSpy).toHaveBeenCalledWith(StatisticsPeriod.Year);
      expect(metricsSpy).toHaveBeenCalledWith(StatisticsPeriod.Year);
    });

    it('should return null when queries return no data', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', () => {
          return HttpResponse.json({ data: { sportPeriodStatistics: null } });
        }),
        graphql.query('SportAverageMetrics', () => {
          return HttpResponse.json({ data: { sportAverageMetrics: null } });
        }),
      );

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
        expect(result.current.metricsLoading).toBe(false);
      });

      expect(result.current.stats).toBeNull();
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('Loading state logic', () => {
    it('should set loading true only when both queries are loading', async () => {
      setupBothHandlers();

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.statsLoading).toBe(true);
      expect(result.current.metricsLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should expose individual loading states', async () => {
      setupBothHandlers();

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
        expect(result.current.metricsLoading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Period changes', () => {
    it('should refetch both queries when period changes', async () => {
      const statsSpy = vi.fn();
      const metricsSpy = vi.fn();

      server.use(
        graphql.query('SportPeriodStatistics', ({ variables }) => {
          statsSpy(variables.period);
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
        graphql.query('SportAverageMetrics', ({ variables }) => {
          metricsSpy(variables.period);
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
      });

      expect(statsSpy).toHaveBeenCalledWith(StatisticsPeriod.Month);
      expect(metricsSpy).toHaveBeenCalledWith(StatisticsPeriod.Month);

      act(() => {
        result.current.setPeriod(StatisticsPeriod.Week);
      });

      await waitFor(() => {
        expect(statsSpy).toHaveBeenCalledWith(StatisticsPeriod.Week);
        expect(metricsSpy).toHaveBeenCalledWith(StatisticsPeriod.Week);
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
        graphql.query('SportAverageMetrics', () => {
          querySpy();
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run, skip: true }), {
        wrapper: createWrapper(),
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(querySpy).not.toHaveBeenCalled();
      expect(result.current.stats).toBeNull();
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should surface stats error', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', () => HttpResponse.error()),
        graphql.query('SportAverageMetrics', () => {
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should surface metrics error when stats succeeds', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', () => {
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
        graphql.query('SportAverageMetrics', () => HttpResponse.error()),
      );

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle both queries failing', async () => {
      server.use(
        graphql.query('SportPeriodStatistics', () => HttpResponse.error()),
        graphql.query('SportAverageMetrics', () => HttpResponse.error()),
      );

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.stats).toBeNull();
      expect(result.current.metrics).toBeNull();
    });
  });

  describe('Refetch', () => {
    it('should refetch both queries when refetch is called', async () => {
      const statsSpy = vi.fn();
      const metricsSpy = vi.fn();

      server.use(
        graphql.query('SportPeriodStatistics', () => {
          statsSpy();
          return HttpResponse.json({
            data: { sportPeriodStatistics: MOCK_SPORT_PERIOD_STATISTICS[SportType.Run] },
          });
        }),
        graphql.query('SportAverageMetrics', () => {
          metricsSpy();
          return HttpResponse.json({
            data: { sportAverageMetrics: MOCK_SPORT_AVERAGE_METRICS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
      });

      expect(statsSpy).toHaveBeenCalledTimes(1);
      expect(metricsSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(statsSpy).toHaveBeenCalledTimes(2);
      expect(metricsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Different sports', () => {
    it('should return sport-specific data for Run', async () => {
      setupBothHandlers();

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
      });

      expect(result.current.stats?.totalDistance).toBe(MOCK_SPORT_PERIOD_STATISTICS[SportType.Run].totalDistance);
      expect(result.current.metrics?.averagePace).toBe(MOCK_SPORT_AVERAGE_METRICS[SportType.Run].averagePace);
    });

    it('should return sport-specific data for Ride', async () => {
      setupBothHandlers();

      testClient = createTestApolloClient();

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Ride }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
      });

      expect(result.current.stats?.totalDistance).toBe(MOCK_SPORT_PERIOD_STATISTICS[SportType.Ride].totalDistance);
      expect(result.current.metrics?.averageSpeed).toBe(MOCK_SPORT_AVERAGE_METRICS[SportType.Ride].averageSpeed);
      expect(result.current.metrics?.averagePower).toBe(MOCK_SPORT_AVERAGE_METRICS[SportType.Ride].averagePower);
    });

    it('should return sport-specific data for Swim', async () => {
      setupBothHandlers();

      testClient = createTestApolloClient();

      const { result } = renderHook(() => usePerformanceOverview({ sportType: SportType.Swim }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.statsLoading).toBe(false);
      });

      expect(result.current.stats?.totalDistance).toBe(MOCK_SPORT_PERIOD_STATISTICS[SportType.Swim].totalDistance);
      expect(result.current.metrics?.averagePace).toBe(MOCK_SPORT_AVERAGE_METRICS[SportType.Swim].averagePace);
    });
  });
});
