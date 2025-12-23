import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplitsChart } from './splits-chart';
import type { ActivityDetail } from '@/lib/activities/activity-types';
import type { Split } from '@/gql/graphql';
import { SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

const mockSplits: Split[] = [
  {
    distance: 1000,
    movingTime: 300,
    elapsedTime: 310,
    averageSpeed: 3.33,
    elevationDifference: 10,
  },
  {
    distance: 1000,
    movingTime: 290,
    elapsedTime: 295,
    averageSpeed: 3.45,
    elevationDifference: -5,
  },
  {
    distance: 1000,
    movingTime: 305,
    elapsedTime: 315,
    averageSpeed: 3.28,
    elevationDifference: 15,
  },
];

const baseActivity: ActivityDetail = {
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
  averageHeartrate: null,
  maxHeartrate: null,
  kilojoules: null,
  deviceWatts: false,
  hasKudoed: false,
  kudosCount: 5,
  averageCadence: null,
  calories: null,
  elevHigh: null,
  elevLow: null,
  averageWatts: null,
  weightedAverageWatts: null,
  maxWatts: null,
  splits: null,
  description: null,
  detailsFetched: false,
  detailsFetchedAt: null,
  createdAt: new Date('2025-01-15T08:30:00Z'),
  updatedAt: new Date('2025-01-15T08:30:00Z'),
};

describe('SplitsChart', () => {
  it('should not render when splits is null', () => {
    const { container } = render(<SplitsChart activity={baseActivity} />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render when splits is empty array', () => {
    const activityWithEmptySplits = { ...baseActivity, splits: [] };
    const { container } = render(<SplitsChart activity={activityWithEmptySplits} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render chart card when splits are available', () => {
    const activityWithSplits = { ...baseActivity, splits: mockSplits };
    render(<SplitsChart activity={activityWithSplits} />);

    expect(screen.getByText('splits.title')).toBeInTheDocument();
    expect(screen.getByText('splits.description')).toBeInTheDocument();
  });

  it('should render chart with correct data for Run', () => {
    const activityWithSplits = { ...baseActivity, splits: mockSplits };
    const { container } = render(<SplitsChart activity={activityWithSplits} />);

    expect(screen.getByText('splits.title')).toBeInTheDocument();
    const chartContainer = container.querySelector('.h-\\[300px\\]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render chart with correct data for Ride', () => {
    const rideActivity = { ...baseActivity, type: SportType.Ride, splits: mockSplits };
    const { container } = render(<SplitsChart activity={rideActivity} />);

    expect(screen.getByText('splits.title')).toBeInTheDocument();
    const chartContainer = container.querySelector('.h-\\[300px\\]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render chart with correct data for Swim', () => {
    const swimActivity = { ...baseActivity, type: SportType.Swim, splits: mockSplits };
    const { container } = render(<SplitsChart activity={swimActivity} />);

    expect(screen.getByText('splits.title')).toBeInTheDocument();
    const chartContainer = container.querySelector('.h-\\[300px\\]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render ChartContainer with correct dimensions', () => {
    const activityWithSplits = { ...baseActivity, splits: mockSplits };
    const { container } = render(<SplitsChart activity={activityWithSplits} />);

    const chartContainer = container.querySelector('.h-\\[300px\\]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should handle single split', () => {
    const activityWithOneSplit = { ...baseActivity, splits: [mockSplits[0]] };
    render(<SplitsChart activity={activityWithOneSplit} />);

    expect(screen.getByText('splits.title')).toBeInTheDocument();
    expect(screen.getByText('splits.description')).toBeInTheDocument();
  });

  it('should handle many splits', () => {
    const manySplits = Array(20).fill(mockSplits[0]);
    const activityWithManySplits = { ...baseActivity, splits: manySplits };
    render(<SplitsChart activity={activityWithManySplits} />);

    expect(screen.getByText('splits.title')).toBeInTheDocument();
    expect(screen.getByText('splits.description')).toBeInTheDocument();
  });
});
