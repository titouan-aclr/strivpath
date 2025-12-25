import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityHeader } from './activity-header';
import type { ActivityDetail } from '@/lib/activities/activity-types';
import { SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

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

describe('ActivityHeader', () => {
  it('should render activity name', () => {
    render(<ActivityHeader activity={mockActivity} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Morning Run' })).toBeInTheDocument();
  });

  it('should render activity date', () => {
    render(<ActivityHeader activity={mockActivity} />);

    expect(screen.getByText(/January 15, 2025/)).toBeInTheDocument();
  });

  it('should render activity time', () => {
    render(<ActivityHeader activity={mockActivity} />);

    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('should render sport type badge', () => {
    render(<ActivityHeader activity={mockActivity} />);

    const badge = screen.getByText('sportTypes.run');
    expect(badge).toBeInTheDocument();
  });

  it('should render sport icon for Run', () => {
    const { container } = render(<ActivityHeader activity={mockActivity} />);

    const iconContainer = container.querySelector('.bg-strava-orange\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should render sport icon for Ride', () => {
    const rideActivity = { ...mockActivity, type: SportType.Ride };
    const { container } = render(<ActivityHeader activity={rideActivity} />);

    const iconContainer = container.querySelector('.bg-strava-orange\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should render sport icon for Swim', () => {
    const swimActivity = { ...mockActivity, type: SportType.Swim };
    const { container } = render(<ActivityHeader activity={swimActivity} />);

    const iconContainer = container.querySelector('.bg-strava-orange\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should render calendar and clock icons', () => {
    const { container } = render(<ActivityHeader activity={mockActivity} />);

    const icons = container.querySelectorAll('svg.lucide');
    expect(icons.length).toBeGreaterThan(0);
  });
});
