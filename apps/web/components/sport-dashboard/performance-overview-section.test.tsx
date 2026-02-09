import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PerformanceOverviewSection } from './performance-overview-section';
import { SportType, StatisticsPeriod } from '@/gql/graphql';
import type { SportPeriodStatistics, SportAverageMetrics } from '@/gql/graphql';

const mockSetPeriod = vi.fn();
const mockUsePerformanceOverview = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const namespaces: Record<string, Record<string, string>> = {
      'sportDashboard.performanceOverview': {
        title: 'Performance',
        'tabs.volume': 'Volume',
        'tabs.averages': 'Averages',
        'periods.week': 'Week',
        'periods.month': 'Month',
        'periods.year': 'Year',
      },
      'sportDashboard.stats': {
        title: 'Statistics',
        distance: 'Distance',
        duration: 'Duration',
        sessions: 'Sessions',
        elevation: 'Elevation',
      },
      'sportDashboard.averageMetrics': {
        title: 'Average Metrics',
        pace: 'Avg Pace',
        speed: 'Avg Speed',
        heartRate: 'Avg Heart Rate',
        cadence: 'Avg Cadence',
        power: 'Avg Power',
      },
    };
    return namespaces[namespace]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/sport-dashboard/hooks/use-performance-overview', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  usePerformanceOverview: (...args: unknown[]) => mockUsePerformanceOverview(...args),
}));

const mockStats: SportPeriodStatistics = {
  totalDistance: 42500,
  totalDuration: 9000,
  activityCount: 15,
  totalElevation: 850,
  distanceTrend: 12.5,
  durationTrend: -5.3,
  activityTrend: 8.0,
  elevationTrend: 3.2,
};

const mockMetrics: SportAverageMetrics = {
  averagePace: 330,
  averageSpeed: 5.5,
  averageHeartRate: 155,
  averageCadence: 180,
  averagePower: 250,
};

describe('PerformanceOverviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePerformanceOverview.mockReturnValue({
      stats: mockStats,
      metrics: mockMetrics,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      statsLoading: false,
      metricsLoading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('should render with Volume tab active by default', () => {
    render(<PerformanceOverviewSection sportType={SportType.Run} />);

    expect(screen.getByRole('tab', { name: 'Volume' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Distance')).toBeInTheDocument();
  });

  it('should render both tab triggers', () => {
    render(<PerformanceOverviewSection sportType={SportType.Run} />);

    expect(screen.getByRole('tab', { name: 'Volume' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Averages' })).toBeInTheDocument();
  });

  it('should switch to Averages tab when clicked', async () => {
    const user = userEvent.setup();
    render(<PerformanceOverviewSection sportType={SportType.Run} />);

    await user.click(screen.getByRole('tab', { name: 'Averages' }));

    expect(screen.getByRole('tab', { name: 'Averages' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Avg Pace')).toBeInTheDocument();
    expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
  });

  it('should render PeriodSwitch with 3 options', () => {
    render(<PerformanceOverviewSection sportType={SportType.Run} />);

    expect(screen.getByRole('radio', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Year' })).toBeInTheDocument();
  });

  it('should call setPeriod when PeriodSwitch is clicked', async () => {
    const user = userEvent.setup();
    render(<PerformanceOverviewSection sportType={SportType.Run} />);

    await user.click(screen.getByRole('radio', { name: 'Week' }));

    expect(mockSetPeriod).toHaveBeenCalledWith(StatisticsPeriod.Week);
  });

  describe('Volume tab', () => {
    it('should render 4 cards for Running (with elevation)', () => {
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('Elevation')).toBeInTheDocument();
    });

    it('should render 4 cards for Cycling (with elevation)', () => {
      render(<PerformanceOverviewSection sportType={SportType.Ride} />);

      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.getByText('Elevation')).toBeInTheDocument();
    });

    it('should render 3 cards for Swimming (no elevation)', () => {
      render(<PerformanceOverviewSection sportType={SportType.Swim} />);

      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
      expect(screen.queryByText('Elevation')).not.toBeInTheDocument();
    });

    it('should display formatted distance', () => {
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.getByText('42.50 km')).toBeInTheDocument();
    });

    it('should display formatted duration', () => {
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.getByText('2h 30m')).toBeInTheDocument();
    });

    it('should display session count', () => {
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display formatted elevation', () => {
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.getByText('850 m')).toBeInTheDocument();
    });

    it('should display positive trends', () => {
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getAllByText('↑').length).toBeGreaterThan(0);
    });

    it('should display negative trends', () => {
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.getByText('-5.3%')).toBeInTheDocument();
      expect(screen.getAllByText('↓').length).toBeGreaterThan(0);
    });

    it('should not show trend when null', () => {
      mockUsePerformanceOverview.mockReturnValue({
        stats: { ...mockStats, distanceTrend: null, durationTrend: null, activityTrend: null, elevationTrend: null },
        metrics: mockMetrics,
        period: StatisticsPeriod.Month,
        setPeriod: mockSetPeriod,
        loading: false,
        statsLoading: false,
        metricsLoading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      expect(screen.queryByText('↑')).not.toBeInTheDocument();
      expect(screen.queryByText('↓')).not.toBeInTheDocument();
    });

    it('should handle stats null with dash values', () => {
      mockUsePerformanceOverview.mockReturnValue({
        stats: null,
        metrics: mockMetrics,
        period: StatisticsPeriod.Month,
        setPeriod: mockSetPeriod,
        loading: false,
        statsLoading: false,
        metricsLoading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBe(4);
    });
  });

  describe('Averages tab', () => {
    it('should render Pace, Heart Rate, Cadence for Running', async () => {
      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.getByText('Avg Pace')).toBeInTheDocument();
      expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
      expect(screen.queryByText('Avg Speed')).not.toBeInTheDocument();
    });

    it('should render Speed, Heart Rate, Cadence, Power for Cycling with power data', async () => {
      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Ride} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.getByText('Avg Speed')).toBeInTheDocument();
      expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
      expect(screen.getByText('Avg Power')).toBeInTheDocument();
    });

    it('should not render Power for Cycling when power is null', async () => {
      mockUsePerformanceOverview.mockReturnValue({
        stats: mockStats,
        metrics: { ...mockMetrics, averagePower: null },
        period: StatisticsPeriod.Month,
        setPeriod: mockSetPeriod,
        loading: false,
        statsLoading: false,
        metricsLoading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Ride} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.queryByText('Avg Power')).not.toBeInTheDocument();
    });

    it('should format pace correctly for Running (min/km)', async () => {
      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.getByText('5:30 min/km')).toBeInTheDocument();
    });

    it('should format speed correctly for Cycling (km/h)', async () => {
      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Ride} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.getByText('19.8 km/h')).toBeInTheDocument();
    });

    it('should format heart rate correctly (bpm)', async () => {
      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.getByText('155 bpm')).toBeInTheDocument();
    });

    it('should format cadence correctly for Running (spm)', async () => {
      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.getByText('180 spm')).toBeInTheDocument();
    });

    it('should format power correctly for Cycling (W)', async () => {
      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Ride} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      expect(screen.getByText('250 W')).toBeInTheDocument();
    });

    it('should handle metrics null (all dashes)', async () => {
      mockUsePerformanceOverview.mockReturnValue({
        stats: mockStats,
        metrics: null,
        period: StatisticsPeriod.Month,
        setPeriod: mockSetPeriod,
        loading: false,
        statsLoading: false,
        metricsLoading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const user = userEvent.setup();
      render(<PerformanceOverviewSection sportType={SportType.Run} />);

      await user.click(screen.getByRole('tab', { name: 'Averages' }));

      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should render skeleton when both queries loading', () => {
    mockUsePerformanceOverview.mockReturnValue({
      stats: null,
      metrics: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: true,
      statsLoading: true,
      metricsLoading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<PerformanceOverviewSection sportType={SportType.Run} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render cards when loading', () => {
    mockUsePerformanceOverview.mockReturnValue({
      stats: null,
      metrics: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: true,
      statsLoading: true,
      metricsLoading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<PerformanceOverviewSection sportType={SportType.Run} />);

    expect(screen.queryByText('Distance')).not.toBeInTheDocument();
  });

  it('should pass sportColor to StatCards', () => {
    const { container } = render(<PerformanceOverviewSection sportType={SportType.Run} />);

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
  });

  it('should have accessible section landmark', () => {
    render(<PerformanceOverviewSection sportType={SportType.Run} />);

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
  });
});
