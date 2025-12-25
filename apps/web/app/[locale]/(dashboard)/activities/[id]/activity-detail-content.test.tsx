import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityDetailContent } from './activity-detail-content';
import type { ActivityDetail } from '@/lib/activities/activity-types';
import { SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'invalidId.title': 'Invalid Activity ID',
      'invalidId.description': 'The provided activity ID is not valid',
      'invalidId.backButton': 'Back to Activities',
      'error.title': 'Failed to load activity',
      'error.description': 'An error occurred while fetching activity details',
      'error.retry': 'Retry',
      'error.backButton': 'Back to Activities',
      'notFound.title': 'Activity not found',
      'notFound.description': 'This activity does not exist or you do not have access to it',
      'notFound.backButton': 'Back to Activities',
      backButton: 'Back to Activities',
    };
    return translations[key] || key;
  },
}));

vi.mock('@/lib/activities/use-activity-detail');
vi.mock('@/components/activities/detail/activity-header', () => ({
  ActivityHeader: () => <div data-testid="activity-header">Activity Header</div>,
}));
vi.mock('@/components/activities/detail/stats-grid', () => ({
  StatsGrid: () => <div data-testid="stats-grid">Stats Grid</div>,
}));
vi.mock('@/components/activities/detail/splits-chart', () => ({
  SplitsChart: () => <div data-testid="splits-chart">Splits Chart</div>,
}));
vi.mock('@/components/activities/detail/activity-detail-skeleton', () => ({
  ActivityDetailSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

const mockUseActivityDetailDefaults = {
  detailsLoading: false,
  detailsLoaded: true,
  detailsError: undefined,
  retryDetails: vi.fn(),
};

const mockActivity: ActivityDetail = {
  __typename: 'Activity',
  id: '1',
  stravaId: BigInt(123456789),
  name: 'Morning Run',
  type: SportType.Run,
  distance: 10000,
  movingTime: 3600,
  elapsedTime: 3720,
  totalElevationGain: 150,
  startDate: new Date('2025-01-15T08:30:00Z'),
  startDateLocal: new Date('2025-01-15T09:30:00+01:00'),
  timezone: 'Europe/Paris',
  averageSpeed: 2.78,
  maxSpeed: 3.5,
  averageHeartrate: 145,
  maxHeartrate: 165,
  kilojoules: 500,
  deviceWatts: false,
  hasKudoed: false,
  kudosCount: 5,
  averageCadence: 85,
  calories: 450,
  elevHigh: 200,
  elevLow: 50,
  averageWatts: null,
  weightedAverageWatts: null,
  maxWatts: null,
  splits: null,
  description: null,
  detailsFetched: true,
  detailsFetchedAt: new Date('2025-01-15T08:35:00Z'),
  createdAt: new Date('2025-01-15T08:30:00Z'),
  updatedAt: new Date('2025-01-15T08:30:00Z'),
};

describe('ActivityDetailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Invalid ID state', () => {
    it('should show invalid ID error for non-numeric string', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');
      vi.mocked(useActivityDetail).mockReturnValue({
        activity: null,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        isValidId: false,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="abc" />);

      expect(screen.getByText('Invalid Activity ID')).toBeInTheDocument();
      expect(screen.getByText('The provided activity ID is not valid')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to activities/i })).toHaveAttribute('href', '/activities');
    });

    it('should show invalid ID error for negative number', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');
      vi.mocked(useActivityDetail).mockReturnValue({
        activity: null,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        isValidId: false,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="-123" />);

      expect(screen.getByText('Invalid Activity ID')).toBeInTheDocument();
    });

    it('should show invalid ID error for zero', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');
      vi.mocked(useActivityDetail).mockReturnValue({
        activity: null,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        isValidId: false,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="0" />);

      expect(screen.getByText('Invalid Activity ID')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show skeleton while loading', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');
      vi.mocked(useActivityDetail).mockReturnValue({
        activity: null,
        loading: true,
        error: undefined,
        refetch: vi.fn(),
        isValidId: true,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="123456" />);

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error message with retry button', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');
      const mockRefetch = vi.fn();

      vi.mocked(useActivityDetail).mockReturnValue({
        activity: null,
        loading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
        isValidId: true,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="123456" />);

      expect(screen.getByText('Failed to load activity')).toBeInTheDocument();
      expect(screen.getByText('An error occurred while fetching activity details')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to activities/i })).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');
      const mockRefetch = vi.fn().mockResolvedValue({});
      const user = userEvent.setup();

      vi.mocked(useActivityDetail).mockReturnValue({
        activity: null,
        loading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
        isValidId: true,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="123456" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Not found state', () => {
    it('should show not found message when activity is null', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');

      vi.mocked(useActivityDetail).mockReturnValue({
        activity: null,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        isValidId: true,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="123456" />);

      expect(screen.getByText('Activity not found')).toBeInTheDocument();
      expect(screen.getByText('This activity does not exist or you do not have access to it')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to activities/i })).toHaveAttribute('href', '/activities');
    });
  });

  describe('Success state', () => {
    it('should render full activity details', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');

      vi.mocked(useActivityDetail).mockReturnValue({
        activity: mockActivity,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        isValidId: true,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="123456" />);

      expect(screen.getByTestId('activity-header')).toBeInTheDocument();
      expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
      expect(screen.getByTestId('splits-chart')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to activities/i })).toHaveAttribute('href', '/activities');
    });

    it('should render back button in success state', async () => {
      const { useActivityDetail } = await import('@/lib/activities/use-activity-detail');

      vi.mocked(useActivityDetail).mockReturnValue({
        activity: mockActivity,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
        isValidId: true,
        ...mockUseActivityDetailDefaults,
      });

      render(<ActivityDetailContent stravaId="123456" />);

      const backButtons = screen.getAllByRole('link', { name: /back to activities/i });
      expect(backButtons[0]).toHaveAttribute('href', '/activities');
    });
  });
});
