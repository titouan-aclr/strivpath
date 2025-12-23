import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsGrid } from './stats-grid';
import type { ActivityDetail } from '@/lib/activities/activity-types';
import { SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

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

describe('StatsGrid', () => {
  it('should render primary stats', () => {
    render(<StatsGrid activity={baseActivity} detailsLoading={false} />);

    expect(screen.getByText('stats.distance')).toBeInTheDocument();
    expect(screen.getByText('stats.duration')).toBeInTheDocument();
    expect(screen.getByText('stats.elevation')).toBeInTheDocument();
  });

  it('should render pace label for Run', () => {
    render(<StatsGrid activity={baseActivity} detailsLoading={false} />);

    expect(screen.getByText('stats.pace')).toBeInTheDocument();
    expect(screen.queryByText('stats.speed')).not.toBeInTheDocument();
  });

  it('should render speed label for Ride', () => {
    const rideActivity = { ...baseActivity, type: SportType.Ride };
    render(<StatsGrid activity={rideActivity} detailsLoading={false} />);

    expect(screen.getByText('stats.speed')).toBeInTheDocument();
    expect(screen.queryByText('stats.pace')).not.toBeInTheDocument();
  });

  it('should render pace label for Swim', () => {
    const swimActivity = { ...baseActivity, type: SportType.Swim };
    render(<StatsGrid activity={swimActivity} detailsLoading={false} />);

    expect(screen.getByText('stats.pace')).toBeInTheDocument();
  });

  it('should not render secondary stats when all are null', () => {
    render(<StatsGrid activity={baseActivity} detailsLoading={false} />);

    expect(screen.queryByText('stats.avgHr')).not.toBeInTheDocument();
    expect(screen.queryByText('stats.maxHr')).not.toBeInTheDocument();
    expect(screen.queryByText('stats.cadence')).not.toBeInTheDocument();
    expect(screen.queryByText('stats.altitude')).not.toBeInTheDocument();
    expect(screen.queryByText('stats.calories')).not.toBeInTheDocument();
    expect(screen.queryByText('stats.power')).not.toBeInTheDocument();
  });

  it('should render average heart rate when available', () => {
    const activityWithHr = { ...baseActivity, averageHeartrate: 145 };
    render(<StatsGrid activity={activityWithHr} detailsLoading={false} />);

    expect(screen.getByText('stats.avgHr')).toBeInTheDocument();
    expect(screen.getByText('145 bpm')).toBeInTheDocument();
  });

  it('should render max heart rate when available', () => {
    const activityWithMaxHr = { ...baseActivity, maxHeartrate: 165 };
    render(<StatsGrid activity={activityWithMaxHr} detailsLoading={false} />);

    expect(screen.getByText('stats.maxHr')).toBeInTheDocument();
    expect(screen.getByText('165 bpm')).toBeInTheDocument();
  });

  it('should render cadence when available', () => {
    const activityWithCadence = { ...baseActivity, averageCadence: 85 };
    render(<StatsGrid activity={activityWithCadence} detailsLoading={false} />);

    expect(screen.getByText('stats.cadence')).toBeInTheDocument();
    expect(screen.getByText('85 spm')).toBeInTheDocument();
  });

  it('should render altitude range when both elevHigh and elevLow are available', () => {
    const activityWithAltitude = { ...baseActivity, elevHigh: 200, elevLow: 50 };
    render(<StatsGrid activity={activityWithAltitude} detailsLoading={false} />);

    expect(screen.getByText('stats.altitude')).toBeInTheDocument();
    expect(screen.getByText('50 m → 200 m')).toBeInTheDocument();
  });

  it('should not render altitude when only elevHigh is available', () => {
    const activityWithOnlyHigh = { ...baseActivity, elevHigh: 200 };
    render(<StatsGrid activity={activityWithOnlyHigh} detailsLoading={false} />);

    expect(screen.queryByText('stats.altitude')).not.toBeInTheDocument();
  });

  it('should not render altitude when only elevLow is available', () => {
    const activityWithOnlyLow = { ...baseActivity, elevLow: 50 };
    render(<StatsGrid activity={activityWithOnlyLow} detailsLoading={false} />);

    expect(screen.queryByText('stats.altitude')).not.toBeInTheDocument();
  });

  it('should render calories when available', () => {
    const activityWithCalories = { ...baseActivity, calories: 450 };
    render(<StatsGrid activity={activityWithCalories} detailsLoading={false} />);

    expect(screen.getByText('stats.calories')).toBeInTheDocument();
    expect(screen.getByText('450 kcal')).toBeInTheDocument();
  });

  it('should render power when averageWatts is available', () => {
    const activityWithPower = { ...baseActivity, averageWatts: 250 };
    render(<StatsGrid activity={activityWithPower} detailsLoading={false} />);

    expect(screen.getByText('stats.power')).toBeInTheDocument();
    expect(screen.getByText('250 W')).toBeInTheDocument();
  });

  it('should render normalized power when weightedAverageWatts is available', () => {
    const activityWithNP = { ...baseActivity, averageWatts: 250, weightedAverageWatts: 270 };
    render(<StatsGrid activity={activityWithNP} detailsLoading={false} />);

    expect(screen.getByText('stats.power')).toBeInTheDocument();
    expect(screen.getByText('250 W')).toBeInTheDocument();
    expect(screen.getByText('NP: 270 W')).toBeInTheDocument();
  });

  it('should render all secondary stats when available', () => {
    const fullActivity: ActivityDetail = {
      ...baseActivity,
      averageHeartrate: 145,
      maxHeartrate: 165,
      averageCadence: 85,
      elevHigh: 200,
      elevLow: 50,
      calories: 450,
      averageWatts: 250,
      weightedAverageWatts: 270,
    };

    render(<StatsGrid activity={fullActivity} detailsLoading={false} />);

    expect(screen.getByText('stats.avgHr')).toBeInTheDocument();
    expect(screen.getByText('stats.maxHr')).toBeInTheDocument();
    expect(screen.getByText('stats.cadence')).toBeInTheDocument();
    expect(screen.getByText('stats.altitude')).toBeInTheDocument();
    expect(screen.getByText('stats.calories')).toBeInTheDocument();
    expect(screen.getByText('stats.power')).toBeInTheDocument();
  });

  it('should render elapsed time as subValue in duration card', () => {
    render(<StatsGrid activity={baseActivity} detailsLoading={false} />);

    expect(screen.getByText(/stats.elapsed/)).toBeInTheDocument();
  });
});
