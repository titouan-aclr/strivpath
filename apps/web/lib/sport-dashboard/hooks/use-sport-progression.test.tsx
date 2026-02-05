import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { getProgressionDataForPeriod } from '@/mocks/fixtures/sport-dashboard.fixture';
import { SportType, StatisticsPeriod, ProgressionMetric } from '@/gql/graphql';
import { useSportProgression } from './use-sport-progression';
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

describe('useSportProgression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching progression data', () => {
    it('should fetch progression data with default period and metric', async () => {
      server.use(
        graphql.query('SportProgressionData', ({ variables }) => {
          const period = variables.period as StatisticsPeriod;
          return HttpResponse.json({
            data: { sportProgressionData: getProgressionDataForPeriod(period) },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.period).toBe(StatisticsPeriod.Month);
      expect(result.current.metric).toBe(ProgressionMetric.Distance);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.error).toBeUndefined();
    });

    it('should use initial period and metric when provided', async () => {
      server.use(
        graphql.query('SportProgressionData', ({ variables }) => {
          expect(variables.period).toBe(StatisticsPeriod.Week);
          expect(variables.metric).toBe(ProgressionMetric.Duration);
          return HttpResponse.json({
            data: { sportProgressionData: getProgressionDataForPeriod(StatisticsPeriod.Week) },
          });
        }),
      );

      const { result } = renderHook(
        () =>
          useSportProgression({
            sportType: SportType.Run,
            initialPeriod: StatisticsPeriod.Week,
            initialMetric: ProgressionMetric.Duration,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.period).toBe(StatisticsPeriod.Week);
      expect(result.current.metric).toBe(ProgressionMetric.Duration);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should return empty array when no data', async () => {
      server.use(
        graphql.query('SportProgressionData', () => {
          return HttpResponse.json({
            data: { sportProgressionData: [] },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('Available metrics', () => {
    it('should return correct available metrics for Run sport', () => {
      server.use(
        graphql.query('SportProgressionData', () => {
          return HttpResponse.json({
            data: { sportProgressionData: [] },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.availableMetrics).toContain(ProgressionMetric.Distance);
      expect(result.current.availableMetrics).toContain(ProgressionMetric.Duration);
      expect(result.current.availableMetrics).toContain(ProgressionMetric.Pace);
      expect(result.current.availableMetrics).toContain(ProgressionMetric.Sessions);
      expect(result.current.availableMetrics).toContain(ProgressionMetric.Elevation);
      expect(result.current.availableMetrics).not.toContain(ProgressionMetric.Speed);
    });

    it('should return correct available metrics for Ride sport', () => {
      server.use(
        graphql.query('SportProgressionData', () => {
          return HttpResponse.json({
            data: { sportProgressionData: [] },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Ride }), {
        wrapper: createWrapper(),
      });

      expect(result.current.availableMetrics).toContain(ProgressionMetric.Speed);
      expect(result.current.availableMetrics).not.toContain(ProgressionMetric.Pace);
    });

    it('should return correct available metrics for Swim sport', () => {
      server.use(
        graphql.query('SportProgressionData', () => {
          return HttpResponse.json({
            data: { sportProgressionData: [] },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Swim }), {
        wrapper: createWrapper(),
      });

      expect(result.current.availableMetrics).not.toContain(ProgressionMetric.Elevation);
    });
  });

  describe('Period changes', () => {
    it('should refetch when period changes', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('SportProgressionData', ({ variables }) => {
          querySpy(variables.period);
          const period = variables.period as StatisticsPeriod;
          return HttpResponse.json({
            data: { sportProgressionData: getProgressionDataForPeriod(period) },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setPeriod(StatisticsPeriod.Year);
      });

      await waitFor(() => {
        expect(querySpy).toHaveBeenCalledWith(StatisticsPeriod.Year);
      });

      expect(result.current.period).toBe(StatisticsPeriod.Year);
    });
  });

  describe('Metric changes', () => {
    it('should refetch when metric changes', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('SportProgressionData', ({ variables }) => {
          querySpy(variables.metric);
          return HttpResponse.json({
            data: { sportProgressionData: getProgressionDataForPeriod(StatisticsPeriod.Month) },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(querySpy).toHaveBeenCalledWith(ProgressionMetric.Distance);

      act(() => {
        result.current.setMetric(ProgressionMetric.Duration);
      });

      await waitFor(() => {
        expect(querySpy).toHaveBeenCalledWith(ProgressionMetric.Duration);
      });

      expect(result.current.metric).toBe(ProgressionMetric.Duration);
    });
  });

  describe('Skip behavior', () => {
    it('should not fetch when skip is true', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('SportProgressionData', () => {
          querySpy();
          return HttpResponse.json({
            data: { sportProgressionData: getProgressionDataForPeriod(StatisticsPeriod.Month) },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run, skip: true }), {
        wrapper: createWrapper(),
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(querySpy).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('SportProgressionData', () => HttpResponse.error()));

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toEqual([]);
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.query('SportProgressionData', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Internal error',
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
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
        graphql.query('SportProgressionData', () => {
          querySpy();
          return HttpResponse.json({
            data: { sportProgressionData: getProgressionDataForPeriod(StatisticsPeriod.Month) },
          });
        }),
      );

      const { result } = renderHook(() => useSportProgression({ sportType: SportType.Run }), {
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
