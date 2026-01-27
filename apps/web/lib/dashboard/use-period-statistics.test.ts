import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePeriodStatistics } from './use-period-statistics';
import { StatisticsPeriod } from '@/gql/graphql';

const { mockUseQuery, mockGetFragmentData } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockGetFragmentData: vi.fn(<T>(_: unknown, data: T): T => data),
}));

vi.mock('@apollo/client/react', () => ({
  useQuery: mockUseQuery,
}));

vi.mock('@/gql/fragment-masking', () => ({
  getFragmentData: mockGetFragmentData,
}));

vi.mock('@/gql/graphql', async () => {
  const actual = await vi.importActual('@/gql/graphql');
  return {
    ...actual,
    PeriodStatisticsDocument: { kind: 'Document' },
    PeriodStatisticsFragmentFragmentDoc: { kind: 'Document' },
  };
});

const mockStatistics = {
  totalTime: 7200,
  activityCount: 5,
  averageTimePerSession: 1440,
  periodStart: new Date('2025-01-01T00:00:00.000Z'),
  periodEnd: new Date('2025-01-07T23:59:59.999Z'),
};

describe('usePeriodStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should return loading true when query is loading', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePeriodStatistics());

      expect(result.current.loading).toBe(true);
      expect(result.current.statistics).toBeNull();
    });

    it('should return loading false when query completes', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePeriodStatistics());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should return error when query fails', () => {
      const error = new Error('Network error');
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePeriodStatistics());

      expect(result.current.error).toEqual(error);
      expect(result.current.statistics).toBeNull();
    });
  });

  describe('Success State', () => {
    it('should return statistics correctly', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePeriodStatistics());

      expect(result.current.statistics).toEqual({
        totalTime: 7200,
        activityCount: 5,
        averageTimePerSession: 1440,
        periodStart: new Date('2025-01-01T00:00:00.000Z'),
        periodEnd: new Date('2025-01-07T23:59:59.999Z'),
      });
    });

    it('should return null statistics when data is null', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePeriodStatistics());

      expect(result.current.statistics).toBeNull();
    });

    it('should return null statistics when periodStatistics is null', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: null },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => usePeriodStatistics());

      expect(result.current.statistics).toBeNull();
    });
  });

  describe('Options', () => {
    it('should use default period WEEK when not specified', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: { period: StatisticsPeriod.Week },
        }),
      );
    });

    it('should pass custom period to query', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics({ period: StatisticsPeriod.Month }));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: { period: StatisticsPeriod.Month },
        }),
      );
    });

    it('should pass year period to query', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics({ period: StatisticsPeriod.Year }));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: { period: StatisticsPeriod.Year },
        }),
      );
    });

    it('should skip query when skip option is true', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics({ skip: true }));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: true,
        }),
      );
    });

    it('should not skip query by default', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: false,
        }),
      );
    });
  });

  describe('Refetch', () => {
    it('should call apolloRefetch when refetch is called', async () => {
      const apolloRefetch = vi.fn().mockResolvedValue({});
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: apolloRefetch,
      });

      const { result } = renderHook(() => usePeriodStatistics());

      await result.current.refetch();

      expect(apolloRefetch).toHaveBeenCalled();
    });

    it('should call apolloRefetch without arguments when no period provided', async () => {
      const apolloRefetch = vi.fn().mockResolvedValue({});
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: apolloRefetch,
      });

      const { result } = renderHook(() => usePeriodStatistics());

      await result.current.refetch();

      expect(apolloRefetch).toHaveBeenCalledWith(undefined);
    });

    it('should pass new period to refetch', async () => {
      const apolloRefetch = vi.fn().mockResolvedValue({});
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: apolloRefetch,
      });

      const { result } = renderHook(() => usePeriodStatistics());

      await result.current.refetch(StatisticsPeriod.Month);

      expect(apolloRefetch).toHaveBeenCalledWith({ period: StatisticsPeriod.Month });
    });

    it('should pass year period to refetch', async () => {
      const apolloRefetch = vi.fn().mockResolvedValue({});
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: apolloRefetch,
      });

      const { result } = renderHook(() => usePeriodStatistics());

      await result.current.refetch(StatisticsPeriod.Year);

      expect(apolloRefetch).toHaveBeenCalledWith({ period: StatisticsPeriod.Year });
    });
  });

  describe('Query Configuration', () => {
    it('should use cache-and-network fetch policy', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fetchPolicy: 'cache-and-network',
        }),
      );
    });

    it('should use cache-first as next fetch policy', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nextFetchPolicy: 'cache-first',
        }),
      );
    });

    it('should notify on network status change', () => {
      mockUseQuery.mockReturnValue({
        data: { periodStatistics: mockStatistics },
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => usePeriodStatistics());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          notifyOnNetworkStatusChange: true,
        }),
      );
    });
  });
});
