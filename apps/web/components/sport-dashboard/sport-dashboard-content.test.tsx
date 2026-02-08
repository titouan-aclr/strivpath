import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SportDashboardContent } from './sport-dashboard-content';
import { SportType } from '@/gql/graphql';

const mockUseSportActivities = vi.fn();
const mockUseSync = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, string>) => {
    const namespaces: Record<string, Record<string, string>> = {
      'sportDashboard.empty': {
        title: 'No activities yet',
        description: `Start recording ${params?.sport ?? ''} activities on Strava and sync them to see your dashboard.`,
      },
      'sportDashboard.recentActivities': {
        empty: 'No recent activities for this sport',
      },
      'navigation.sports': {
        running: 'Running',
        cycling: 'Cycling',
        swimming: 'Swimming',
      },
    };
    return namespaces[namespace]?.[key] ?? key;
  },
}));

vi.mock('@/lib/sport-dashboard/hooks/use-sport-activities', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useSportActivities: (...args: unknown[]) => mockUseSportActivities(...args),
}));

vi.mock('@/lib/sync/context', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useSync: () => mockUseSync(),
}));

vi.mock('./sport-dashboard-header', () => ({
  SportDashboardHeader: ({ sportType, lastSyncTime }: { sportType: string; lastSyncTime?: unknown }) => (
    <div data-testid="sport-dashboard-header" data-sport-type={sportType} data-last-sync-time={String(lastSyncTime)}>
      Header
    </div>
  ),
}));

vi.mock('./sport-stats-section', () => ({
  SportStatsSection: ({ sportType }: { sportType: string }) => (
    <div data-testid="sport-stats-section" data-sport-type={sportType}>
      Stats
    </div>
  ),
}));

vi.mock('./progression-chart', () => ({
  ProgressionChartSection: ({ sportType }: { sportType: string }) => (
    <div data-testid="progression-chart-section" data-sport-type={sportType}>
      Progression
    </div>
  ),
}));

vi.mock('./sport-goals-section', () => ({
  SportGoalsSection: ({ sportType }: { sportType: string }) => (
    <div data-testid="sport-goals-section" data-sport-type={sportType}>
      Goals
    </div>
  ),
}));

vi.mock('./average-metrics', () => ({
  AverageMetricsSection: ({ sportType }: { sportType: string }) => (
    <div data-testid="average-metrics-section" data-sport-type={sportType}>
      Metrics
    </div>
  ),
}));

vi.mock('./personal-records-section', () => ({
  PersonalRecordsSection: ({ sportType }: { sportType: string }) => (
    <div data-testid="personal-records-section" data-sport-type={sportType}>
      Records
    </div>
  ),
}));

vi.mock('@/components/dashboard/recent-activities', () => ({
  RecentActivities: ({
    activities,
    loading,
    emptyIcon,
    emptyMessage,
    sportColor,
  }: {
    activities: unknown[];
    loading?: boolean;
    emptyIcon?: unknown;
    emptyMessage?: string;
    sportColor?: { text: string };
  }) => (
    <div
      data-testid="recent-activities"
      data-activities-count={activities.length}
      data-loading={String(!!loading)}
      data-has-empty-icon={String(!!emptyIcon)}
      data-empty-message={emptyMessage ?? ''}
      data-has-sport-color={String(!!sportColor)}
      data-sport-color-text={sportColor?.text ?? ''}
    >
      Recent Activities
    </div>
  ),
}));

vi.mock('./sport-dashboard-skeleton', () => ({
  SportDashboardSkeleton: () => <div data-testid="sport-dashboard-skeleton">Skeleton</div>,
}));

vi.mock('@/components/dashboard/empty-state', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state" data-title={title} data-description={description}>
      {title}
    </div>
  ),
}));

vi.mock('@/components/dashboard/dashboard-error', () => ({
  DashboardError: ({ onRetry }: { onRetry: () => void }) => (
    <div data-testid="dashboard-error">
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

const mockActivity = {
  id: '1',
  stravaId: '123',
  name: 'Test Run',
  type: 'Run',
  startDate: new Date(),
  distance: 10000,
  movingTime: 3000,
  totalElevationGain: 100,
  kudosCount: 0,
  maxHeartrate: null,
};

describe('SportDashboardContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSync.mockReturnValue({
      syncHistory: { completedAt: '2025-06-01T12:00:00Z' },
    });
  });

  describe('Loading state', () => {
    it('should render skeleton when loading with no data', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [],
        loading: true,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(screen.getByTestId('sport-dashboard-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('sport-dashboard-header')).not.toBeInTheDocument();
    });

    it('should render full dashboard when loading with cached data', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [mockActivity],
        loading: true,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(screen.queryByTestId('sport-dashboard-skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('sport-dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('sport-stats-section')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should render DashboardError when error with no data', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [],
        loading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
      expect(screen.queryByTestId('sport-dashboard-header')).not.toBeInTheDocument();
    });

    it('should render full dashboard when error with cached data', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [mockActivity],
        loading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(screen.queryByTestId('dashboard-error')).not.toBeInTheDocument();
      expect(screen.getByTestId('sport-dashboard-header')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render EmptyState when no activities', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should still render header when empty', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(screen.getByTestId('sport-dashboard-header')).toBeInTheDocument();
    });

    it('should include sport name in empty state', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.getAttribute('data-description')).toContain('Running');
    });
  });

  describe('Full dashboard', () => {
    beforeEach(() => {
      mockUseSportActivities.mockReturnValue({
        activities: [mockActivity],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });
    });

    it('should render all 7 sections', () => {
      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(screen.getByTestId('sport-dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('sport-stats-section')).toBeInTheDocument();
      expect(screen.getByTestId('progression-chart-section')).toBeInTheDocument();
      expect(screen.getByTestId('sport-goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('average-metrics-section')).toBeInTheDocument();
      expect(screen.getByTestId('personal-records-section')).toBeInTheDocument();
      expect(screen.getByTestId('recent-activities')).toBeInTheDocument();
    });

    it('should pass sportType to all sport-specific sections', () => {
      render(<SportDashboardContent sportType={SportType.Ride} />);

      expect(screen.getByTestId('sport-dashboard-header')).toHaveAttribute('data-sport-type', 'RIDE');
      expect(screen.getByTestId('sport-stats-section')).toHaveAttribute('data-sport-type', 'RIDE');
      expect(screen.getByTestId('progression-chart-section')).toHaveAttribute('data-sport-type', 'RIDE');
      expect(screen.getByTestId('sport-goals-section')).toHaveAttribute('data-sport-type', 'RIDE');
      expect(screen.getByTestId('average-metrics-section')).toHaveAttribute('data-sport-type', 'RIDE');
      expect(screen.getByTestId('personal-records-section')).toHaveAttribute('data-sport-type', 'RIDE');
    });

    it('should pass activities and sport-specific empty state to RecentActivities', () => {
      render(<SportDashboardContent sportType={SportType.Run} />);

      const recentActivities = screen.getByTestId('recent-activities');
      expect(recentActivities).toHaveAttribute('data-activities-count', '1');
      expect(recentActivities).toHaveAttribute('data-has-empty-icon', 'true');
      expect(recentActivities).toHaveAttribute('data-empty-message', 'No recent activities for this sport');
    });

    it('should pass sport color to RecentActivities', () => {
      render(<SportDashboardContent sportType={SportType.Run} />);

      const recentActivities = screen.getByTestId('recent-activities');
      expect(recentActivities).toHaveAttribute('data-has-sport-color', 'true');
      expect(recentActivities).toHaveAttribute('data-sport-color-text', 'text-lime-500');
    });

    it('should render goals and metrics in a 2-column grid', () => {
      const { container } = render(<SportDashboardContent sportType={SportType.Run} />);

      const grid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
      expect(grid?.querySelector('[data-testid="sport-goals-section"]')).toBeInTheDocument();
      expect(grid?.querySelector('[data-testid="average-metrics-section"]')).toBeInTheDocument();
    });
  });

  describe('Hook initialization', () => {
    it('should call useSportActivities with limit 3', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Swim} />);

      expect(mockUseSportActivities).toHaveBeenCalledWith({ sportType: SportType.Swim, limit: 3 });
    });

    it('should call useSync', () => {
      mockUseSportActivities.mockReturnValue({
        activities: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<SportDashboardContent sportType={SportType.Run} />);

      expect(mockUseSync).toHaveBeenCalled();
    });
  });
});
