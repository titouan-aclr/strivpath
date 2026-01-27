import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboard } from './use-dashboard';
import { GoalStatus, GoalTargetType, SportType, StatisticsPeriod, SyncStatus } from '@/gql/graphql';

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
    DashboardDataDocument: { kind: 'Document' },
    PeriodStatisticsFragmentFragmentDoc: { kind: 'Document' },
    DashboardGoalFragmentFragmentDoc: { kind: 'Document' },
    ActivityCalendarDayFragmentFragmentDoc: { kind: 'Document' },
    SportDistributionFragmentFragmentDoc: { kind: 'Document' },
    ActivityCardFragmentDoc: { kind: 'Document' },
    DashboardSyncHistoryFragmentFragmentDoc: { kind: 'Document' },
  };
});

const mockPeriodStatistics = {
  totalTime: 7200,
  activityCount: 5,
  averageTimePerSession: 1440,
  periodStart: new Date('2025-01-01T00:00:00.000Z'),
  periodEnd: new Date('2025-01-07T23:59:59.999Z'),
};

const mockGoal = {
  id: '1',
  title: 'Run 50km this month',
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  currentValue: 25,
  startDate: new Date('2025-01-01T00:00:00.000Z'),
  endDate: new Date('2025-01-31T23:59:59.999Z'),
  sportType: SportType.Run,
  status: GoalStatus.Active,
  progressPercentage: 50,
  daysRemaining: 15,
  isExpired: false,
  progressHistory: [
    { date: new Date('2025-01-05T00:00:00.000Z'), value: 10 },
    { date: new Date('2025-01-10T00:00:00.000Z'), value: 25 },
  ],
};

const mockCalendarDay = {
  date: new Date('2025-01-05T00:00:00.000Z'),
  hasActivity: true,
};

const mockSportDistribution = {
  sport: SportType.Run,
  percentage: 60,
  totalTime: 4320,
};

const mockActivity = {
  id: '1',
  stravaId: BigInt(123456789),
  name: 'Morning Run',
  type: 'Run',
  distance: 5000,
  movingTime: 1800,
  elapsedTime: 1900,
  totalElevationGain: 50,
  startDate: new Date('2025-01-15T07:00:00.000Z'),
  averageSpeed: 2.78,
  maxHeartrate: 165,
  kudosCount: 5,
};

const mockSyncHistory = {
  id: '1',
  completedAt: new Date('2025-01-15T08:00:00.000Z'),
  status: SyncStatus.Completed,
  stage: 'DONE',
};

const mockCurrentUser = {
  id: '1',
  firstname: 'John',
  lastname: 'Doe',
};

const mockUserPreferences = {
  selectedSports: [SportType.Run, SportType.Ride],
};

const createMockData = (overrides = {}) => ({
  periodStatistics: mockPeriodStatistics,
  dashboardGoals: [mockGoal],
  activityCalendar: [mockCalendarDay],
  sportDistribution: [mockSportDistribution],
  activities: [mockActivity],
  latestSyncHistory: mockSyncHistory,
  currentUser: mockCurrentUser,
  userPreferences: mockUserPreferences,
  ...overrides,
});

describe('useDashboard', () => {
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

      const { result } = renderHook(() => useDashboard());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('should return loading false when query completes', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

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

      const { result } = renderHook(() => useDashboard());

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeNull();
    });
  });

  describe('Success State', () => {
    it('should return period statistics correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.periodStatistics).toEqual({
        totalTime: 7200,
        activityCount: 5,
        averageTimePerSession: 1440,
        periodStart: new Date('2025-01-01T00:00:00.000Z'),
        periodEnd: new Date('2025-01-07T23:59:59.999Z'),
      });
    });

    it('should return dashboard goals correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.dashboardGoals).toHaveLength(1);
      expect(result.current.dashboardGoals[0].title).toBe('Run 50km this month');
      expect(result.current.dashboardGoals[0].progressHistory).toHaveLength(2);
    });

    it('should return activity calendar correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.activityCalendar).toHaveLength(1);
      expect(result.current.activityCalendar[0].hasActivity).toBe(true);
    });

    it('should return sport distribution correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.sportDistribution).toHaveLength(1);
      expect(result.current.sportDistribution[0].sport).toBe(SportType.Run);
      expect(result.current.sportDistribution[0].percentage).toBe(60);
    });

    it('should return recent activities correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.recentActivities).toHaveLength(1);
      expect(result.current.recentActivities[0].name).toBe('Morning Run');
    });

    it('should return sync history correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.latestSyncHistory).not.toBeNull();
      expect(result.current.latestSyncHistory?.status).toBe(SyncStatus.Completed);
    });

    it('should return current user correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.currentUser).not.toBeNull();
      expect(result.current.currentUser?.firstname).toBe('John');
    });

    it('should return user preferences correctly', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.userPreferences).not.toBeNull();
      expect(result.current.userPreferences?.selectedSports).toHaveLength(2);
    });
  });

  describe('Helper Booleans', () => {
    it('should return hasActivities true when activities exist', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.hasActivities).toBe(true);
    });

    it('should return hasActivities false when no activities', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData({ activities: [] }),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.hasActivities).toBe(false);
    });

    it('should return hasGoals true when goals exist', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.hasGoals).toBe(true);
    });

    it('should return hasGoals false when no goals', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData({ dashboardGoals: [] }),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.hasGoals).toBe(false);
    });

    it('should return hasMultipleSports true when multiple sports selected', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.hasMultipleSports).toBe(true);
    });

    it('should return hasMultipleSports false when single sport selected', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData({
          userPreferences: { selectedSports: [SportType.Run] },
        }),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.hasMultipleSports).toBe(false);
    });
  });

  describe('Options', () => {
    it('should pass period option to query', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useDashboard({ period: StatisticsPeriod.Month }));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: expect.objectContaining({
            period: StatisticsPeriod.Month,
          }),
        }),
      );
    });

    it('should use default period when not specified', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useDashboard());

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: expect.objectContaining({
            period: StatisticsPeriod.Week,
          }),
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

      renderHook(() => useDashboard({ skip: true }));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: true,
        }),
      );
    });

    it('should pass activitiesLimit to query', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderHook(() => useDashboard({ activitiesLimit: 10 }));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variables: expect.objectContaining({
            activitiesLimit: 10,
          }),
        }),
      );
    });
  });

  describe('Refetch', () => {
    it('should call apolloRefetch when refetch is called', async () => {
      const apolloRefetch = vi.fn().mockResolvedValue({});
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: apolloRefetch,
      });

      const { result } = renderHook(() => useDashboard());

      await result.current.refetch();

      expect(apolloRefetch).toHaveBeenCalled();
    });

    it('should pass new variables to refetch', async () => {
      const apolloRefetch = vi.fn().mockResolvedValue({});
      mockUseQuery.mockReturnValue({
        data: createMockData(),
        loading: false,
        error: null,
        refetch: apolloRefetch,
      });

      const { result } = renderHook(() => useDashboard());

      await result.current.refetch({ period: StatisticsPeriod.Year });

      expect(apolloRefetch).toHaveBeenCalledWith(
        expect.objectContaining({
          period: StatisticsPeriod.Year,
        }),
      );
    });
  });

  describe('Null Data Handling', () => {
    it('should handle null latestSyncHistory', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData({ latestSyncHistory: null }),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.latestSyncHistory).toBeNull();
    });

    it('should handle null currentUser', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData({ currentUser: null }),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.currentUser).toBeNull();
    });

    it('should handle null userPreferences', () => {
      mockUseQuery.mockReturnValue({
        data: createMockData({ userPreferences: null }),
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.userPreferences).toBeNull();
      expect(result.current.hasMultipleSports).toBe(false);
    });

    it('should return empty arrays when data is null', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDashboard());

      expect(result.current.dashboardGoals).toEqual([]);
      expect(result.current.activityCalendar).toEqual([]);
      expect(result.current.sportDistribution).toEqual([]);
      expect(result.current.recentActivities).toEqual([]);
    });
  });
});
