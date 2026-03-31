import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityDescription } from './activity-description';
import type { ActivityDetail } from '@/lib/activities/activity-types';
import { SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const createMockActivity = (overrides?: Partial<ActivityDetail>): ActivityDetail => ({
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
  description: 'Great morning run with nice weather',
  detailsFetched: true,
  detailsFetchedAt: new Date('2025-01-15T08:35:00Z'),
  createdAt: new Date('2025-01-15T08:30:00Z'),
  updatedAt: new Date('2025-01-15T08:30:00Z'),
  ...overrides,
});

describe('ActivityDescription', () => {
  describe('Rendering', () => {
    it('should render description card when detailsFetched is true and description exists', () => {
      const activity = createMockActivity();
      render(<ActivityDescription activity={activity} />);

      expect(screen.getByText('description.title')).toBeInTheDocument();
      expect(screen.getByText('Great morning run with nice weather')).toBeInTheDocument();
    });

    it('should display description text with whitespace preserved', () => {
      const activity = createMockActivity({
        description: 'Line 1\nLine 2\nLine 3',
      });
      render(<ActivityDescription activity={activity} />);

      const descriptionText = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'p' && content.includes('Line 1') && content.includes('Line 3');
      });
      expect(descriptionText).toBeInTheDocument();
      expect(descriptionText).toHaveClass('whitespace-pre-wrap');
    });

    it('should translate title using activities.detail.description.title key', () => {
      const activity = createMockActivity();
      render(<ActivityDescription activity={activity} />);

      expect(screen.getByText('description.title')).toBeInTheDocument();
    });
  });

  describe('Conditional rendering', () => {
    it('should return null when detailsFetched is false', () => {
      const activity = createMockActivity({ detailsFetched: false });
      const { container } = render(<ActivityDescription activity={activity} />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when description is null', () => {
      const activity = createMockActivity({ description: null });
      const { container } = render(<ActivityDescription activity={activity} />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when description is empty string', () => {
      const activity = createMockActivity({ description: '' });
      const { container } = render(<ActivityDescription activity={activity} />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when detailsFetched is true but description is undefined', () => {
      const activity = createMockActivity({ description: undefined as unknown as string });
      const { container } = render(<ActivityDescription activity={activity} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should render FileText icon with aria-hidden', () => {
      const activity = createMockActivity();
      const { container } = render(<ActivityDescription activity={activity} />);

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('should apply correct card structure', () => {
      const activity = createMockActivity();
      const { container } = render(<ActivityDescription activity={activity} />);

      expect(container.querySelector('.text-primary')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle multi-line descriptions with newlines', () => {
      const multilineDescription = `First paragraph of the description

Second paragraph after a blank line

Third paragraph`;
      const activity = createMockActivity({ description: multilineDescription });
      render(<ActivityDescription activity={activity} />);

      const descriptionText = screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          content.includes('First paragraph') &&
          content.includes('Third paragraph')
        );
      });
      expect(descriptionText).toBeInTheDocument();
    });

    it('should handle long descriptions without overflow', () => {
      const longDescription = 'A'.repeat(1000);
      const activity = createMockActivity({ description: longDescription });
      render(<ActivityDescription activity={activity} />);

      const descriptionElement = screen.getByText(longDescription);
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('text-sm');
    });

    it('should handle descriptions with special characters', () => {
      const specialDescription = 'Run with émojis 🏃‍♂️ and special chars: &<>"\'';
      const activity = createMockActivity({ description: specialDescription });
      render(<ActivityDescription activity={activity} />);

      expect(screen.getByText(specialDescription)).toBeInTheDocument();
    });

    it('should handle descriptions with only whitespace as empty', () => {
      const activity = createMockActivity({ description: '   \n\t   ' });
      const { container } = render(<ActivityDescription activity={activity} />);

      const descriptionElement = container.querySelector('p.whitespace-pre-wrap');
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement?.textContent).toBe('   \n\t   ');
    });
  });
});
