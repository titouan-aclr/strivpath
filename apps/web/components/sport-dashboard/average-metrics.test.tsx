import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AverageMetricsSection } from './average-metrics';
import { SportType, StatisticsPeriod } from '@/gql/graphql';
import type { SportAverageMetrics } from '@/gql/graphql';

const mockSetPeriod = vi.fn();
const mockUseSportAverageMetrics = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Average Metrics',
      pace: 'Avg Pace',
      speed: 'Avg Speed',
      heartRate: 'Avg Heart Rate',
      cadence: 'Avg Cadence',
      power: 'Avg Power',
      'periods.week': 'Week',
      'periods.month': 'Month',
      'periods.year': 'Year',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/sport-dashboard/hooks/use-sport-average-metrics', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useSportAverageMetrics: (...args: unknown[]) => mockUseSportAverageMetrics(...args),
}));

const mockMetrics: SportAverageMetrics = {
  averagePace: 330,
  averageSpeed: 5.5,
  averageHeartRate: 155,
  averageCadence: 180,
  averagePower: 250,
};

describe('AverageMetricsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSportAverageMetrics.mockReturnValue({
      metrics: mockMetrics,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('should render section title', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.getByText('Average Metrics')).toBeInTheDocument();
  });

  it('should render Pace, Heart Rate, Cadence for Running', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.getByText('Avg Pace')).toBeInTheDocument();
    expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
  });

  it('should render Speed, Heart Rate, Cadence for Cycling', () => {
    mockUseSportAverageMetrics.mockReturnValue({
      metrics: { ...mockMetrics, averagePower: null },
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(screen.getByText('Avg Speed')).toBeInTheDocument();
    expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
  });

  it('should render Speed, Heart Rate, Cadence, Power for Cycling with power data', () => {
    render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(screen.getByText('Avg Speed')).toBeInTheDocument();
    expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
    expect(screen.getByText('Avg Power')).toBeInTheDocument();
  });

  it('should not render Power for Cycling when power is null', () => {
    mockUseSportAverageMetrics.mockReturnValue({
      metrics: { ...mockMetrics, averagePower: null },
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(screen.queryByText('Avg Power')).not.toBeInTheDocument();
  });

  it('should render Pace, Heart Rate, Cadence for Swimming', () => {
    render(<AverageMetricsSection sportType={SportType.Swim} />);

    expect(screen.getByText('Avg Pace')).toBeInTheDocument();
    expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
  });

  it('should not render Speed for Running', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.queryByText('Avg Speed')).not.toBeInTheDocument();
  });

  it('should not render Pace for Cycling', () => {
    render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(screen.queryByText('Avg Pace')).not.toBeInTheDocument();
  });

  it('should format pace correctly for Running (min/km)', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.getByText('5:30 min/km')).toBeInTheDocument();
  });

  it('should format pace correctly for Swimming (/100m)', () => {
    render(<AverageMetricsSection sportType={SportType.Swim} />);

    expect(screen.getByText('0:33 /100m')).toBeInTheDocument();
  });

  it('should format speed correctly for Cycling (km/h)', () => {
    render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(screen.getByText('19.8 km/h')).toBeInTheDocument();
  });

  it('should format heart rate correctly (bpm)', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.getByText('155 bpm')).toBeInTheDocument();
  });

  it('should format cadence correctly for Running (spm)', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.getByText('180 spm')).toBeInTheDocument();
  });

  it('should format cadence correctly for Cycling (rpm)', () => {
    render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(screen.getByText('180 rpm')).toBeInTheDocument();
  });

  it('should format power correctly for Cycling (W)', () => {
    render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(screen.getByText('250 W')).toBeInTheDocument();
  });

  it('should render PeriodSwitch', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.getByRole('radio', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Year' })).toBeInTheDocument();
  });

  it('should call setPeriod when PeriodSwitch is clicked', async () => {
    const user = userEvent.setup();
    render(<AverageMetricsSection sportType={SportType.Run} />);

    await user.click(screen.getByRole('radio', { name: 'Year' }));

    expect(mockSetPeriod).toHaveBeenCalledWith(StatisticsPeriod.Year);
  });

  it('should render skeleton when loading', () => {
    mockUseSportAverageMetrics.mockReturnValue({
      metrics: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<AverageMetricsSection sportType={SportType.Run} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render cards when loading', () => {
    mockUseSportAverageMetrics.mockReturnValue({
      metrics: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.queryByText('Avg Pace')).not.toBeInTheDocument();
  });

  it('should handle metrics null (all dashes)', () => {
    mockUseSportAverageMetrics.mockReturnValue({
      metrics: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<AverageMetricsSection sportType={SportType.Run} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('should pass sportColor to StatCards for Running', () => {
    const { container } = render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
  });

  it('should pass sportColor to StatCards for Cycling', () => {
    const { container } = render(<AverageMetricsSection sportType={SportType.Ride} />);

    expect(container.querySelector('.bg-purple-400\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-purple-500')).toBeInTheDocument();
  });

  it('should have accessible section landmark', () => {
    render(<AverageMetricsSection sportType={SportType.Run} />);

    expect(screen.getByRole('region', { name: /average metrics/i })).toBeInTheDocument();
  });
});
