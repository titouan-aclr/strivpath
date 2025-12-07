import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityList } from './activity-list';
import type { ActivityCardFragment } from '@/gql/graphql';

const messages = {
  activities: {
    card: {
      distance: 'Distance',
      duration: 'Duration',
      elevation: 'Elevation',
      pace: 'Pace',
      speed: 'Speed',
      kudos: 'kudos',
    },
    list: {
      empty: {
        title: 'No activities found',
        description: 'Try adjusting your filters or date range',
      },
      error: {
        title: 'Failed to load activities',
        description: 'Something went wrong while loading your activities. Please try again.',
        retry: 'Retry',
      },
      loading: 'Loading activities...',
      loadingMore: 'Loading more activities...',
    },
  },
};

const mockActivities: ActivityCardFragment[] = [
  {
    id: '1',
    stravaId: BigInt(123456789),
    name: 'Morning Run',
    type: 'RUN',
    distance: 5000,
    movingTime: 1800,
    elapsedTime: 1900,
    totalElevationGain: 50,
    startDate: new Date('2024-12-05T07:30:00Z'),
    averageSpeed: 2.78,
    maxHeartrate: 165,
    kudosCount: 5,
  },
  {
    id: '2',
    stravaId: BigInt(987654321),
    name: 'Evening Ride',
    type: 'RIDE',
    distance: 20000,
    movingTime: 3600,
    elapsedTime: 3700,
    totalElevationGain: 200,
    startDate: new Date('2024-12-04T17:00:00Z'),
    averageSpeed: 5.56,
    maxHeartrate: null,
    kudosCount: 0,
  },
];

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

let mockIntersectionObserver: {
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

let intersectionCallback: IntersectionObserverCallback;

describe('ActivityList', () => {
  beforeEach(() => {
    mockIntersectionObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    global.IntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
      intersectionCallback = callback;
      return mockIntersectionObserver;
    }) as unknown as typeof IntersectionObserver;
  });

  describe('Rendering', () => {
    it('should render list of activities', () => {
      const onLoadMore = vi.fn();
      renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={false} onLoadMore={onLoadMore} />,
      );

      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Evening Ride')).toBeInTheDocument();
    });

    it('should render skeleton when loading and no activities', () => {
      const onLoadMore = vi.fn();
      renderWithIntl(<ActivityList activities={[]} loading={true} hasMore={false} onLoadMore={onLoadMore} />);

      expect(screen.getByLabelText('Loading activities')).toBeInTheDocument();
    });

    it('should render empty state when no activities and not loading', () => {
      const onLoadMore = vi.fn();
      renderWithIntl(<ActivityList activities={[]} loading={false} hasMore={false} onLoadMore={onLoadMore} />);

      expect(screen.getByText('No activities found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or date range')).toBeInTheDocument();
    });

    it('should render loading skeleton at bottom when hasMore is true', () => {
      const onLoadMore = vi.fn();
      renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={true} onLoadMore={onLoadMore} />,
      );

      const skeletons = screen.getAllByLabelText('Loading activities');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render loading skeleton at bottom when hasMore is false', () => {
      const onLoadMore = vi.fn();
      renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={false} onLoadMore={onLoadMore} />,
      );

      expect(screen.queryByLabelText('Loading activities')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      const onLoadMore = vi.fn();
      const error = new Error('Network error');

      renderWithIntl(
        <ActivityList activities={[]} loading={false} error={error} hasMore={false} onLoadMore={onLoadMore} />,
      );

      expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
      expect(
        screen.getByText('Something went wrong while loading your activities. Please try again.'),
      ).toBeInTheDocument();
    });

    it('should display retry button when error and refetch provided', () => {
      const onLoadMore = vi.fn();
      const refetch = vi.fn();
      const error = new Error('Network error');

      renderWithIntl(
        <ActivityList
          activities={[]}
          loading={false}
          error={error}
          hasMore={false}
          onLoadMore={onLoadMore}
          refetch={refetch}
        />,
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onLoadMore = vi.fn();
      const refetch = vi.fn();
      const error = new Error('Network error');

      renderWithIntl(
        <ActivityList
          activities={[]}
          loading={false}
          error={error}
          hasMore={false}
          onLoadMore={onLoadMore}
          refetch={refetch}
        />,
      );

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('should not display retry button when refetch is not provided', () => {
      const onLoadMore = vi.fn();
      const error = new Error('Network error');

      renderWithIntl(
        <ActivityList activities={[]} loading={false} error={error} hasMore={false} onLoadMore={onLoadMore} />,
      );

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should prioritize error state over loading state', () => {
      const onLoadMore = vi.fn();
      const error = new Error('Network error');

      renderWithIntl(
        <ActivityList activities={[]} loading={true} error={error} hasMore={false} onLoadMore={onLoadMore} />,
      );

      expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
      expect(screen.queryByLabelText('Loading activities')).not.toBeInTheDocument();
    });
  });

  describe('Infinite Scroll', () => {
    it('should setup IntersectionObserver when hasMore is true', () => {
      const onLoadMore = vi.fn();

      renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={true} onLoadMore={onLoadMore} />,
      );

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mockIntersectionObserver.observe).toHaveBeenCalled();
    });

    it('should call onLoadMore when observer triggers intersection', async () => {
      const onLoadMore = vi.fn();

      renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={true} onLoadMore={onLoadMore} />,
      );

      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalled();
      });
    });

    it('should not call onLoadMore when not intersecting', async () => {
      const onLoadMore = vi.fn();

      renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={true} onLoadMore={onLoadMore} />,
      );

      intersectionCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);

      await waitFor(() => {
        expect(onLoadMore).not.toHaveBeenCalled();
      });
    });

    it('should disconnect observer on unmount', () => {
      const onLoadMore = vi.fn();

      const { unmount } = renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={true} onLoadMore={onLoadMore} />,
      );

      unmount();

      expect(mockIntersectionObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('Activity Click', () => {
    it('should call onActivityClick when activity is clicked', async () => {
      const user = userEvent.setup();
      const onLoadMore = vi.fn();
      const onActivityClick = vi.fn();

      renderWithIntl(
        <ActivityList
          activities={mockActivities}
          loading={false}
          hasMore={false}
          onLoadMore={onLoadMore}
          onActivityClick={onActivityClick}
        />,
      );

      const activityCard = screen.getByText('Morning Run').closest('[role="button"]');
      expect(activityCard).toBeInTheDocument();

      if (activityCard) {
        await user.click(activityCard);
        expect(onActivityClick).toHaveBeenCalledWith(mockActivities[0]);
      }
    });

    it('should not make activities clickable when onActivityClick is not provided', () => {
      const onLoadMore = vi.fn();

      renderWithIntl(
        <ActivityList activities={mockActivities} loading={false} hasMore={false} onLoadMore={onLoadMore} />,
      );

      const activityCard = screen.getByText('Morning Run').closest('[role="button"]');
      expect(activityCard).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-live and aria-busy attributes', () => {
      const onLoadMore = vi.fn();

      const { container } = renderWithIntl(
        <ActivityList activities={mockActivities} loading={true} hasMore={false} onLoadMore={onLoadMore} />,
      );

      const listContainer = container.querySelector('[aria-live="polite"]');
      expect(listContainer).toBeInTheDocument();
      expect(listContainer).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-hidden on decorative icons', () => {
      const onLoadMore = vi.fn();
      const error = new Error('Network error');

      const { container } = renderWithIntl(
        <ActivityList activities={[]} loading={false} error={error} hasMore={false} onLoadMore={onLoadMore} />,
      );

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });
});
