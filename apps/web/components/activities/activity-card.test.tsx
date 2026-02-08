import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ActivityCard } from './activity-card';
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
  },
};

const mockActivity: ActivityCardFragment = {
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
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>,
  );
};

describe('ActivityCard', () => {
  describe('Rendering', () => {
    it('should render activity name', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });

    it('should render date and time', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText(/Dec 5, 2024/)).toBeInTheDocument();
    });

    it('should render distance', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('5.00 km')).toBeInTheDocument();
    });

    it('should render duration', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('30m')).toBeInTheDocument();
    });

    it('should render elevation', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText('Elevation')).toBeInTheDocument();
      expect(screen.getByText('50 m')).toBeInTheDocument();
    });

    it('should render pace for running activities', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText('Pace')).toBeInTheDocument();
      expect(screen.getByText(/min\/km/)).toBeInTheDocument();
    });

    it('should render speed for cycling activities', () => {
      const cyclingActivity = { ...mockActivity, type: 'RIDE' };
      renderWithIntl(<ActivityCard activity={cyclingActivity} />);
      expect(screen.getByText('Speed')).toBeInTheDocument();
      expect(screen.getByText(/km\/h/)).toBeInTheDocument();
    });

    it('should render sport icon with default orange color', () => {
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} />);
      const iconContainer = container.querySelector('.text-strava-orange');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render sport icon with sport color when provided', () => {
      const sportColor = {
        bg: 'bg-lime-300',
        bgMuted: 'bg-lime-300/10',
        text: 'text-lime-500',
        textMuted: 'text-lime-500/10',
        border: 'border-lime-300',
        ring: 'ring-lime-300',
        chart: 'oklch(0.84 0.18 128)',
      };
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} sportColor={sportColor} />);
      expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
      expect(container.querySelector('.text-strava-orange')).not.toBeInTheDocument();
    });
  });

  describe('Conditional Display', () => {
    it('should display kudos when count is greater than 0', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('5 kudos')).toBeInTheDocument();
    });

    it('should not display kudos section when count is 0', () => {
      const activityWithoutKudos = { ...mockActivity, kudosCount: 0, maxHeartrate: null };
      const { container } = renderWithIntl(<ActivityCard activity={activityWithoutKudos} />);
      const footer = container.querySelector('.border-t');
      expect(footer).not.toBeInTheDocument();
    });

    it('should display heart rate when available', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      expect(screen.getByText('165 bpm')).toBeInTheDocument();
      expect(screen.getByLabelText('165 bpm')).toBeInTheDocument();
    });

    it('should not display heart rate section when not available', () => {
      const activityWithoutHR = { ...mockActivity, maxHeartrate: null, kudosCount: 0 };
      renderWithIntl(<ActivityCard activity={activityWithoutHR} />);
      expect(screen.queryByText(/bpm/)).not.toBeInTheDocument();
    });

    it('should display footer when either kudos or heart rate is available', () => {
      const activityWithOnlyKudos = { ...mockActivity, maxHeartrate: null };
      const { container } = renderWithIntl(<ActivityCard activity={activityWithOnlyKudos} />);
      const footer = container.querySelector('.border-t');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithIntl(<ActivityCard activity={mockActivity} onClick={handleClick} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class when clickable', () => {
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} onClick={() => {}} />);
      const card = container.querySelector('.cursor-pointer');
      expect(card).toBeInTheDocument();
    });

    it('should not have cursor-pointer class when not clickable', () => {
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} />);
      const card = container.querySelector('.cursor-pointer');
      expect(card).not.toBeInTheDocument();
    });

    it('should not be clickable when onClick is not provided', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call onClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithIntl(<ActivityCard activity={mockActivity} onClick={handleClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithIntl(<ActivityCard activity={mockActivity} onClick={handleClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick for other keys', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithIntl(<ActivityCard activity={mockActivity} onClick={handleClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('a');

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button" when clickable', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} onClick={() => {}} />);
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('should not have role="button" when not clickable', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} />);
      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });

    it('should have tabIndex={0} when clickable', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} onClick={() => {}} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have aria-label when clickable', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} onClick={() => {}} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label');
      expect(card.getAttribute('aria-label')).toContain('Morning Run');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} />);
      const sportIconContainer = container.querySelector('[aria-hidden="true"]');
      expect(sportIconContainer).toBeInTheDocument();
    });
  });

  describe('Variant', () => {
    it('should show footer in full variant by default', () => {
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} />);
      const footer = container.querySelector('.border-t');
      expect(footer).toBeInTheDocument();
    });

    it('should show footer in full variant when explicitly set', () => {
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} variant="full" />);
      const footer = container.querySelector('.border-t');
      expect(footer).toBeInTheDocument();
    });

    it('should hide footer in compact variant', () => {
      const { container } = renderWithIntl(<ActivityCard activity={mockActivity} variant="compact" />);
      const footer = container.querySelector('.border-t');
      expect(footer).not.toBeInTheDocument();
    });

    it('should still show all 4 metrics in compact variant', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} variant="compact" />);
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Elevation')).toBeInTheDocument();
      expect(screen.getByText('Pace')).toBeInTheDocument();
    });

    it('should hide kudos in compact variant even when count > 0', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} variant="compact" />);
      expect(screen.queryByLabelText('5 kudos')).not.toBeInTheDocument();
    });

    it('should hide heart rate in compact variant even when available', () => {
      renderWithIntl(<ActivityCard activity={mockActivity} variant="compact" />);
      expect(screen.queryByText('165 bpm')).not.toBeInTheDocument();
    });
  });
});
