import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { RecentActivities } from './recent-activities';
import type { ActivityCardFragment } from '@/gql/graphql';

const mockPush = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const messages = {
  dashboard: {
    recentActivities: {
      title: 'Recent Activities',
      viewAll: 'View all',
      empty: 'No recent activities',
    },
  },
  activities: {
    card: {
      distance: 'Distance',
      duration: 'Duration',
      elevation: 'Elevation',
      pace: 'Pace',
      speed: 'Speed',
      kudos: 'kudos',
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
    stravaId: BigInt(123456790),
    name: 'Evening Ride',
    type: 'RIDE',
    distance: 25000,
    movingTime: 3600,
    elapsedTime: 3800,
    totalElevationGain: 200,
    startDate: new Date('2024-12-04T18:00:00Z'),
    averageSpeed: 6.94,
    maxHeartrate: 150,
    kudosCount: 10,
  },
];

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('RecentActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render section title', () => {
      renderWithIntl(<RecentActivities activities={mockActivities} />);
      expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    });

    it('should render all activities', () => {
      renderWithIntl(<RecentActivities activities={mockActivities} />);
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Evening Ride')).toBeInTheDocument();
    });

    it('should render "View all" button when activities exist', () => {
      renderWithIntl(<RecentActivities activities={mockActivities} />);
      expect(screen.getByText('View all')).toBeInTheDocument();
    });

    it('should not render "View all" button when no activities', () => {
      renderWithIntl(<RecentActivities activities={[]} />);
      expect(screen.queryByText('View all')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty message when no activities', () => {
      renderWithIntl(<RecentActivities activities={[]} />);
      expect(screen.getByText('No recent activities')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      const { container } = renderWithIntl(<RecentActivities activities={[]} loading />);
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render activities when loading', () => {
      renderWithIntl(<RecentActivities activities={mockActivities} loading />);
      expect(screen.queryByText('Morning Run')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to activity detail on click', async () => {
      const user = userEvent.setup();
      renderWithIntl(<RecentActivities activities={mockActivities} />);

      const activityCard = screen.getByRole('button', { name: /Morning Run/i });
      await user.click(activityCard);

      expect(mockPush).toHaveBeenCalledWith('/activities/123456789');
    });

    it('should navigate to activities page when "View all" is clicked', async () => {
      const user = userEvent.setup();
      renderWithIntl(<RecentActivities activities={mockActivities} />);

      const viewAllButton = screen.getByRole('button', { name: /View all/i });
      await user.click(viewAllButton);

      expect(mockPush).toHaveBeenCalledWith('/activities');
    });
  });

  describe('Accessibility', () => {
    it('should have proper section landmark', () => {
      renderWithIntl(<RecentActivities activities={mockActivities} />);
      const section = document.querySelector('section[aria-labelledby="recent-activities-title"]');
      expect(section).toBeInTheDocument();
    });

    it('should have accessible title with correct id', () => {
      renderWithIntl(<RecentActivities activities={mockActivities} />);
      const title = document.getElementById('recent-activities-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Recent Activities');
    });
  });

  describe('Customization', () => {
    it('should render custom empty icon when provided', () => {
      renderWithIntl(<RecentActivities activities={[]} emptyIcon={<span data-testid="custom-icon">Custom</span>} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should render custom empty message when provided', () => {
      renderWithIntl(<RecentActivities activities={[]} emptyMessage="No running activities" />);
      expect(screen.getByText('No running activities')).toBeInTheDocument();
    });

    it('should render default empty icon when emptyIcon is not provided', () => {
      renderWithIntl(<RecentActivities activities={[]} />);
      expect(screen.getByText('No recent activities')).toBeInTheDocument();
    });

    it('should apply className to the section', () => {
      renderWithIntl(<RecentActivities activities={mockActivities} className="mt-4" />);
      const section = document.querySelector('section');
      expect(section).toHaveClass('mt-4');
    });

    it('should pass sportColor to activity cards', () => {
      const sportColor = {
        bg: 'bg-lime-300',
        bgMuted: 'bg-lime-300/10',
        text: 'text-lime-500',
        textMuted: 'text-lime-500/10',
        border: 'border-lime-300',
        ring: 'ring-lime-300',
        chart: 'oklch(0.84 0.18 128)',
      };
      const { container } = renderWithIntl(<RecentActivities activities={mockActivities} sportColor={sportColor} />);
      expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
      expect(container.querySelector('.text-strava-orange')).not.toBeInTheDocument();
    });
  });
});
