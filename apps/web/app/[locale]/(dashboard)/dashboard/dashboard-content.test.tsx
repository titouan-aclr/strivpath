import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardContent } from './dashboard-content';
import { useDashboard } from '@/lib/dashboard/use-dashboard';
import { StatisticsPeriod } from '@/lib/dashboard/types';
import { useSync } from '@/lib/sync/context';
import type {
  BaseGoal,
  PrimaryGoal,
  SecondaryGoal,
  DashboardUser,
  DashboardSyncHistory,
  PeriodStats,
  ActivityCalendarDay,
  SportDistributionItem,
  DashboardActivity,
} from '@/lib/dashboard/types';
import { GoalTargetType, GoalStatus, SportType } from '@/gql/graphql';

vi.mock('@/lib/dashboard/use-dashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('@/lib/dashboard/utils', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/dashboard/utils')>();
  return {
    ...actual,
    getCurrentYear: vi.fn().mockReturnValue(2024),
  };
});

vi.mock('@/lib/sync/context', () => ({
  useSync: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.newUser': {
        title: 'Import your Strava activities',
        description: 'Sync your data to start tracking your performance and set your goals.',
        cta: 'Sync now',
      },
      'dashboard.sync': {
        syncing: 'Syncing...',
      },
    };
    return translations[namespace]?.[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/components/dashboard', () => ({
  DashboardHeader: ({
    user,
    syncHistory,
    loading,
  }: {
    user: DashboardUser | null;
    syncHistory: DashboardSyncHistory | null;
    loading?: boolean;
  }) => (
    <div data-testid="dashboard-header" data-loading={loading}>
      {user?.firstname && <span data-testid="user-name">{user.firstname}</span>}
      {syncHistory?.completedAt && <span data-testid="sync-history">Synced</span>}
    </div>
  ),
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading skeleton</div>,
  StatsSection: ({
    statistics,
    period,
    onPeriodChange,
    loading,
  }: {
    statistics: PeriodStats | null;
    period: StatisticsPeriod;
    onPeriodChange: (period: StatisticsPeriod) => void;
    loading?: boolean;
  }) => (
    <div data-testid="stats-section" data-period={period} data-loading={loading}>
      {statistics && <span data-testid="stats-activity-count">{statistics.activityCount}</span>}
      <button data-testid="change-period-week" onClick={() => onPeriodChange(StatisticsPeriod.Week)}>
        Week
      </button>
      <button data-testid="change-period-month" onClick={() => onPeriodChange(StatisticsPeriod.Month)}>
        Month
      </button>
      <button data-testid="change-period-year" onClick={() => onPeriodChange(StatisticsPeriod.Year)}>
        Year
      </button>
    </div>
  ),
  GoalsSection: ({
    primaryGoal,
    secondaryGoals,
  }: {
    primaryGoal: PrimaryGoal | null;
    secondaryGoals: SecondaryGoal[];
  }) => (
    <div data-testid="goals-section">
      <span data-testid="goals-count">{(primaryGoal ? 1 : 0) + secondaryGoals.length}</span>
      {primaryGoal && (
        <div data-testid={`goal-${primaryGoal.id}`} data-primary="true">
          {primaryGoal.title}
        </div>
      )}
      {secondaryGoals.map(goal => (
        <div key={goal.id} data-testid={`goal-${goal.id}`} data-secondary="true">
          {goal.title}
        </div>
      ))}
    </div>
  ),
  ActivityHeatmap: ({ calendarData, year }: { calendarData: ActivityCalendarDay[]; year?: number }) => (
    <div data-testid="activity-heatmap" data-year={year}>
      <span data-testid="calendar-days-count">{calendarData.length}</span>
    </div>
  ),
  SportDistribution: ({ distribution }: { distribution: SportDistributionItem[] }) => (
    <div data-testid="sport-distribution">
      <span data-testid="distribution-count">{distribution.length}</span>
    </div>
  ),
  RecentActivities: ({ activities, loading }: { activities: unknown[]; loading?: boolean }) => (
    <div data-testid="recent-activities" data-loading={loading}>
      <span data-testid="activities-count">{activities.length}</span>
    </div>
  ),
  EmptyState: ({
    icon,
    title,
    description,
    action,
  }: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div data-testid="empty-state">
      {icon && <div data-testid="empty-state-icon">{icon}</div>}
      <h3 data-testid="empty-state-title">{title}</h3>
      {description && <p data-testid="empty-state-description">{description}</p>}
      {action && (
        <button data-testid="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  ),
}));

const createMockBaseGoal = (id: string, title: string, overrides: Partial<BaseGoal> = {}): BaseGoal => ({
  id,
  title,
  targetType: GoalTargetType.Distance,
  targetValue: 100,
  currentValue: 50,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  sportType: SportType.Run,
  status: GoalStatus.Active,
  progressPercentage: 50,
  daysRemaining: 10,
  isExpired: false,
  ...overrides,
});

const createMockPrimaryGoal = (id: string, title: string, overrides: Partial<PrimaryGoal> = {}): PrimaryGoal => ({
  ...createMockBaseGoal(id, title, overrides),
  progressHistory: [],
  ...overrides,
});

const createMockActivity = (id: string, name: string): DashboardActivity => ({
  id,
  stravaId: id,
  name,
  type: 'Run',
  distance: 5000,
  movingTime: 1800,
  elapsedTime: 2000,
  totalElevationGain: 50,
  startDate: new Date('2024-01-15'),
  averageSpeed: 10,
  maxHeartrate: 180,
  kudosCount: 5,
});

const mockPeriodStats: PeriodStats = {
  totalTime: 3600,
  activityCount: 5,
  averageTimePerSession: 720,
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-07'),
};

const mockUser: DashboardUser = {
  id: '1',
  firstname: 'John',
  lastname: 'Doe',
};

const mockSyncHistory: DashboardSyncHistory = {
  id: '1',
  completedAt: new Date('2024-01-15'),
  status: 'completed',
  stage: null,
};

const mockCalendarData: ActivityCalendarDay[] = [
  { date: new Date('2024-01-15'), hasActivity: true },
  { date: new Date('2024-01-16'), hasActivity: false },
];

const mockSportDistribution: SportDistributionItem[] = [
  { sport: SportType.Run, percentage: 60, totalTime: 3600 },
  { sport: SportType.Ride, percentage: 40, totalTime: 2400 },
];

const baseMockUseDashboard = {
  data: null,
  periodStatistics: mockPeriodStats,
  primaryGoal: null,
  secondaryGoals: [],
  activityCalendar: mockCalendarData,
  sportDistribution: mockSportDistribution,
  recentActivities: [createMockActivity('1', 'Morning Run')],
  latestSyncHistory: mockSyncHistory,
  currentUser: mockUser,
  userPreferences: { selectedSports: [SportType.Run, SportType.Ride] },
  loading: false,
  error: undefined,
  refetch: vi.fn().mockResolvedValue({}),
  hasActivities: true,
  hasGoals: false,
  hasMultipleSports: true,
};

const mockUseSync = {
  syncHistory: null,
  isPolling: false,
  isSyncing: false,
  isLoading: false,
  error: null,
  triggerSource: null,
  triggerSync: vi.fn().mockReturnValue(true),
  retry: vi.fn(),
  refreshStatus: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
};

describe('DashboardContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboard).mockReturnValue(baseMockUseDashboard);
    vi.mocked(useSync).mockReturnValue(mockUseSync);
  });

  describe('Loading State', () => {
    it('should render skeleton when loading and no data', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        loading: true,
        periodStatistics: null,
      });

      render(<DashboardContent />);

      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument();
    });

    it('should render content when loading but has cached data', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        loading: true,
        periodStatistics: mockPeriodStats,
      });

      render(<DashboardContent />);

      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    });
  });

  describe('New User Empty State', () => {
    it('should render new user empty state when no activities', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasActivities: false,
        recentActivities: [],
      });

      render(<DashboardContent />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Import your Strava activities');
      expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
        'Sync your data to start tracking your performance and set your goals.',
      );
    });

    it('should show sync button in empty state', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasActivities: false,
        recentActivities: [],
      });

      render(<DashboardContent />);

      const syncButton = screen.getByTestId('empty-state-action');
      expect(syncButton).toHaveTextContent('Sync now');
    });

    it('should show syncing state on button when syncing', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasActivities: false,
        recentActivities: [],
      });
      vi.mocked(useSync).mockReturnValue({
        ...mockUseSync,
        isSyncing: true,
      });

      render(<DashboardContent />);

      expect(screen.getByTestId('empty-state-action')).toHaveTextContent('Syncing...');
    });

    it('should trigger sync when clicking sync button', async () => {
      const mockTriggerSync = vi.fn();
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasActivities: false,
        recentActivities: [],
      });
      vi.mocked(useSync).mockReturnValue({
        ...mockUseSync,
        triggerSync: mockTriggerSync,
      });

      const user = userEvent.setup();
      render(<DashboardContent />);

      await user.click(screen.getByTestId('empty-state-action'));

      expect(mockTriggerSync).toHaveBeenCalledWith('manual');
    });

    it('should still show header in empty state', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasActivities: false,
        recentActivities: [],
      });

      render(<DashboardContent />);

      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    });
  });

  describe('Full Dashboard Rendering', () => {
    it('should render all dashboard sections when has activities', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-heatmap')).toBeInTheDocument();
      expect(screen.getByTestId('recent-activities')).toBeInTheDocument();
    });

    it('should pass user data to header', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('user-name')).toHaveTextContent('John');
    });

    it('should pass sync history to header', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('sync-history')).toBeInTheDocument();
    });

    it('should pass statistics to stats section', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('stats-activity-count')).toHaveTextContent('5');
    });

    it('should pass calendar data to heatmap', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('calendar-days-count')).toHaveTextContent('2');
    });

    it('should pass activities to recent activities section', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('activities-count')).toHaveTextContent('1');
    });
  });

  describe('Goals Section', () => {
    it('should render goals section with no goals', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('goals-count')).toHaveTextContent('0');
    });

    it('should render single primary goal', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        primaryGoal: createMockPrimaryGoal('1', 'Weekly Running Goal', { sportType: null }),
        secondaryGoals: [],
        hasGoals: true,
      });

      render(<DashboardContent />);

      expect(screen.getByTestId('goals-count')).toHaveTextContent('1');
      expect(screen.getByTestId('goal-1')).toBeInTheDocument();
      expect(screen.getByTestId('goal-1')).toHaveAttribute('data-primary', 'true');
    });

    it('should render primary goal with secondary goals', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        primaryGoal: createMockPrimaryGoal('1', 'Global Goal', { sportType: null }),
        secondaryGoals: [
          createMockBaseGoal('2', 'Running Goal', { sportType: SportType.Run }),
          createMockBaseGoal('3', 'Cycling Goal', { sportType: SportType.Ride }),
        ],
        hasGoals: true,
      });

      render(<DashboardContent />);

      expect(screen.getByTestId('goals-count')).toHaveTextContent('3');
      expect(screen.getByTestId('goal-1')).toHaveAttribute('data-primary', 'true');
      expect(screen.getByTestId('goal-2')).toHaveAttribute('data-secondary', 'true');
      expect(screen.getByTestId('goal-3')).toHaveAttribute('data-secondary', 'true');
    });
  });

  describe('Sport Distribution', () => {
    it('should render sport distribution when multiple sports selected', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('sport-distribution')).toBeInTheDocument();
      expect(screen.getByTestId('distribution-count')).toHaveTextContent('2');
    });

    it('should not render sport distribution when single sport', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasMultipleSports: false,
        sportDistribution: [{ sport: SportType.Run, percentage: 100, totalTime: 3600 }],
      });

      render(<DashboardContent />);

      expect(screen.queryByTestId('sport-distribution')).not.toBeInTheDocument();
    });

    it('should expand heatmap to full width when single sport', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasMultipleSports: false,
      });

      render(<DashboardContent />);

      const heatmap = screen.getByTestId('activity-heatmap');
      expect(heatmap.parentElement).toHaveClass('lg:col-span-3');
    });

    it('should show heatmap in 2/3 width when multiple sports', () => {
      render(<DashboardContent />);

      const heatmap = screen.getByTestId('activity-heatmap');
      expect(heatmap.parentElement).toHaveClass('lg:col-span-2');
    });
  });

  describe('Period Switching', () => {
    it('should start with week period', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('stats-section')).toHaveAttribute('data-period', StatisticsPeriod.Week);
    });

    it('should update period when clicking month button', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({});
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        refetch: mockRefetch,
      });

      const user = userEvent.setup();
      render(<DashboardContent />);

      await user.click(screen.getByTestId('change-period-month'));

      expect(mockRefetch).toHaveBeenCalledWith({ period: StatisticsPeriod.Month });
    });

    it('should update period when clicking year button', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({});
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        refetch: mockRefetch,
      });

      const user = userEvent.setup();
      render(<DashboardContent />);

      await user.click(screen.getByTestId('change-period-year'));

      expect(mockRefetch).toHaveBeenCalledWith({ period: StatisticsPeriod.Year });
    });

    it('should call refetch with new period on period change', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({});
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        refetch: mockRefetch,
      });

      const user = userEvent.setup();
      render(<DashboardContent />);

      await user.click(screen.getByTestId('change-period-week'));

      expect(mockRefetch).toHaveBeenCalledWith({ period: StatisticsPeriod.Week });
    });
  });

  describe('Heatmap Year', () => {
    it('should pass current year to heatmap', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('activity-heatmap')).toHaveAttribute('data-year', '2024');
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize useDashboard with default period week', () => {
      render(<DashboardContent />);

      expect(useDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          period: StatisticsPeriod.Week,
        }),
      );
    });

    it('should initialize useDashboard with current year', () => {
      render(<DashboardContent />);

      expect(useDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          year: 2024,
        }),
      );
    });

    it('should initialize useDashboard with null month for full year view', () => {
      render(<DashboardContent />);

      expect(useDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          month: null,
        }),
      );
    });

    it('should initialize useDashboard with 3 activities limit', () => {
      render(<DashboardContent />);

      expect(useDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          activitiesLimit: 3,
        }),
      );
    });
  });

  describe('Sync Integration', () => {
    it('should show syncing state when polling', () => {
      vi.mocked(useDashboard).mockReturnValue({
        ...baseMockUseDashboard,
        hasActivities: false,
        recentActivities: [],
      });
      vi.mocked(useSync).mockReturnValue({
        ...mockUseSync,
        isPolling: true,
      });

      render(<DashboardContent />);

      expect(screen.getByTestId('empty-state-action')).toHaveTextContent('Syncing...');
    });
  });

  describe('Accessibility', () => {
    it('should render with proper semantic structure', () => {
      render(<DashboardContent />);

      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-heatmap')).toBeInTheDocument();
      expect(screen.getByTestId('recent-activities')).toBeInTheDocument();
    });
  });
});
