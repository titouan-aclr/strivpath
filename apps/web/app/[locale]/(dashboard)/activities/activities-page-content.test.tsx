import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ActivitiesPageContent } from './activities-page-content';
import { useActivities } from '@/lib/activities/use-activities';
import { MOCK_ACTIVITIES_ARRAY } from '@/mocks/fixtures/activity.fixture';
import { OrderBy, OrderDirection } from '@/lib/activities/constants';
import type { ActivityFilter } from '@/lib/activities/types';
import type { ActivityCardFragment } from '@/gql/graphql';
import { ActivityType } from '@/gql/graphql';

vi.mock('@/lib/activities/use-activities');

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => mockRouter,
}));

interface MockActivityListProps {
  activities: ActivityCardFragment[];
  loading: boolean;
  error?: unknown;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onActivityClick?: (activity: ActivityCardFragment) => void;
  refetch?: () => Promise<void>;
}

vi.mock('@/components/activities/activity-filters', () => ({
  ActivityFilters: ({
    filter,
    onFilterChange,
  }: {
    filter: ActivityFilter;
    onFilterChange: (f: ActivityFilter) => void;
  }) => (
    <div data-testid="activity-filters">
      <span data-testid="current-filter">{JSON.stringify(filter)}</span>
      <button
        onClick={() =>
          onFilterChange({ type: ActivityType.Run, orderBy: OrderBy.Date, orderDirection: OrderDirection.Desc })
        }
      >
        Change Filter
      </button>
    </div>
  ),
}));
vi.mock('@/components/activities/activity-list', () => ({
  ActivityList: ({
    activities,
    loading,
    error,
    hasMore,
    onLoadMore,
    onActivityClick,
    refetch,
  }: MockActivityListProps) => (
    <div data-testid="activity-list">
      <span data-testid="loading-state">{loading ? 'loading' : 'not-loading'}</span>
      <span data-testid="error-state">{error ? 'has-error' : 'no-error'}</span>
      <span data-testid="has-more">{hasMore ? 'has-more' : 'no-more'}</span>
      <span data-testid="activities-count">{activities.length}</span>
      {onLoadMore && (
        <button data-testid="load-more-btn" onClick={() => void onLoadMore()}>
          Load More
        </button>
      )}
      {refetch && (
        <button data-testid="refetch-btn" onClick={() => void refetch()}>
          Refetch
        </button>
      )}
      {activities.map(activity => (
        <button
          key={activity.stravaId}
          data-testid={`activity-${activity.stravaId}`}
          onClick={() => onActivityClick?.(activity)}
        >
          {activity.name}
        </button>
      ))}
    </div>
  ),
}));

const messages = {
  activities: {
    page: {
      title: 'Activities',
      description: 'View and analyze all your activities',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('ActivitiesPageContent', () => {
  const mockUseActivities = {
    activities: MOCK_ACTIVITIES_ARRAY.slice(0, 20),
    loading: false,
    error: null,
    hasMore: true,
    loadMore: vi.fn(),
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActivities).mockReturnValue(mockUseActivities);
  });

  describe('Rendering', () => {
    it('should render page title and description', () => {
      renderWithIntl(<ActivitiesPageContent />);

      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('View and analyze all your activities')).toBeInTheDocument();
    });

    it('should render ActivityFilters with default filter', () => {
      renderWithIntl(<ActivitiesPageContent />);

      const filtersElement = screen.getByTestId('activity-filters');
      expect(filtersElement).toBeInTheDocument();

      const currentFilter = screen.getByTestId('current-filter');
      const filterValue = JSON.parse(currentFilter.textContent || '{}');
      expect(filterValue.orderBy).toBe(OrderBy.Date);
      expect(filterValue.orderDirection).toBe(OrderDirection.Desc);
    });

    it('should render ActivityList with activities from hook', () => {
      renderWithIntl(<ActivitiesPageContent />);

      const listElement = screen.getByTestId('activity-list');
      expect(listElement).toBeInTheDocument();

      const activitiesCount = screen.getByTestId('activities-count');
      expect(activitiesCount.textContent).toBe('20');
    });

    it('should pass loading state to ActivityList', () => {
      vi.mocked(useActivities).mockReturnValue({
        ...mockUseActivities,
        loading: true,
      });

      renderWithIntl(<ActivitiesPageContent />);

      const loadingState = screen.getByTestId('loading-state');
      expect(loadingState.textContent).toBe('loading');
    });

    it('should pass error state to ActivityList', () => {
      const error = new Error('Network error');
      vi.mocked(useActivities).mockReturnValue({
        ...mockUseActivities,
        error,
      });

      renderWithIntl(<ActivitiesPageContent />);

      const errorState = screen.getByTestId('error-state');
      expect(errorState.textContent).toBe('has-error');
    });

    it('should pass hasMore to ActivityList', () => {
      renderWithIntl(<ActivitiesPageContent />);

      const hasMoreState = screen.getByTestId('has-more');
      expect(hasMoreState.textContent).toBe('has-more');
    });

    it('should pass loadMore function to ActivityList', () => {
      renderWithIntl(<ActivitiesPageContent />);

      const loadMoreBtn = screen.getByTestId('load-more-btn');
      expect(loadMoreBtn).toBeInTheDocument();
    });

    it('should pass refetch function to ActivityList', () => {
      renderWithIntl(<ActivitiesPageContent />);

      const refetchBtn = screen.getByTestId('refetch-btn');
      expect(refetchBtn).toBeInTheDocument();
    });
  });

  describe('Filter Management', () => {
    it('should initialize with default filter values', () => {
      renderWithIntl(<ActivitiesPageContent />);

      expect(useActivities).toHaveBeenCalledWith({
        filter: {
          orderBy: OrderBy.Date,
          orderDirection: OrderDirection.Desc,
        },
      });
    });

    it('should update filter when ActivityFilters calls onFilterChange', async () => {
      const user = userEvent.setup();
      renderWithIntl(<ActivitiesPageContent />);

      const changeFilterBtn = screen.getByText('Change Filter');
      await user.click(changeFilterBtn);

      const currentFilter = screen.getByTestId('current-filter');
      const filterValue = JSON.parse(currentFilter.textContent || '{}');
      expect(filterValue.type).toBe(ActivityType.Run);
    });

    it('should pass updated filter to useActivities hook after filter change', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithIntl(<ActivitiesPageContent />);

      const changeFilterBtn = screen.getByText('Change Filter');
      await user.click(changeFilterBtn);

      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ActivitiesPageContent />
        </NextIntlClientProvider>,
      );

      expect(useActivities).toHaveBeenLastCalledWith({
        filter: expect.objectContaining({
          type: ActivityType.Run,
        }),
      });
    });
  });

  describe('Activity Navigation', () => {
    it('should navigate to activity detail when activity is clicked', async () => {
      const user = userEvent.setup();
      renderWithIntl(<ActivitiesPageContent />);

      const firstActivity = MOCK_ACTIVITIES_ARRAY[0];
      const activityBtn = screen.getByTestId(`activity-${firstActivity.stravaId}`);
      await user.click(activityBtn);

      expect(mockRouter.push).toHaveBeenCalledWith(`/activities/${firstActivity.stravaId}`);
    });

    it('should use stravaId as URL parameter', async () => {
      const user = userEvent.setup();
      renderWithIntl(<ActivitiesPageContent />);

      const secondActivity = MOCK_ACTIVITIES_ARRAY[1];
      const activityBtn = screen.getByTestId(`activity-${secondActivity.stravaId}`);
      await user.click(activityBtn);

      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining(secondActivity.stravaId.toString()));
    });

    it('should call router.push with correct path format', async () => {
      const user = userEvent.setup();
      renderWithIntl(<ActivitiesPageContent />);

      const activity = MOCK_ACTIVITIES_ARRAY[0];
      const activityBtn = screen.getByTestId(`activity-${activity.stravaId}`);
      await user.click(activityBtn);

      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith(expect.stringMatching(/^\/activities\/\d+$/));
    });
  });

  describe('Hook Integration', () => {
    it('should call loadMore when load more button is clicked', async () => {
      const user = userEvent.setup();
      const mockLoadMore = vi.fn();
      vi.mocked(useActivities).mockReturnValue({
        ...mockUseActivities,
        loadMore: mockLoadMore,
      });

      renderWithIntl(<ActivitiesPageContent />);

      const loadMoreBtn = screen.getByTestId('load-more-btn');
      await user.click(loadMoreBtn);

      expect(mockLoadMore).toHaveBeenCalled();
    });

    it('should call refetch when refetch button is clicked', async () => {
      const user = userEvent.setup();
      const mockRefetch = vi.fn();
      vi.mocked(useActivities).mockReturnValue({
        ...mockUseActivities,
        refetch: mockRefetch,
      });

      renderWithIntl(<ActivitiesPageContent />);

      const refetchBtn = screen.getByTestId('refetch-btn');
      await user.click(refetchBtn);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Internationalization', () => {
    it('should display translated page title', () => {
      renderWithIntl(<ActivitiesPageContent />);

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveTextContent('Activities');
    });

    it('should display translated description', () => {
      renderWithIntl(<ActivitiesPageContent />);

      expect(screen.getByText('View and analyze all your activities')).toBeInTheDocument();
    });
  });
});
