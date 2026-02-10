import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressionChartSection } from './index';
import { ProgressionMetric, SportType, StatisticsPeriod } from '@/gql/graphql';
import { MOCK_PROGRESSION_DATA_WEEKLY } from '@/mocks/fixtures/sport-dashboard.fixture';

const mockSetPeriod = vi.fn();
const mockSetMetric = vi.fn();
const mockUseSportProgression = vi.fn();

const progressionTranslations: Record<string, string> = {
  title: 'My Progression',
  empty: 'No data available for this period',
  'periods.weekly': 'Weekly',
  'periods.monthly': 'Monthly',
};

const metricTranslations: Record<string, string> = {
  distance: 'Distance',
  duration: 'Duration',
  pace: 'Pace',
  speed: 'Speed',
  sessions: 'Sessions',
  elevation: 'Elevation',
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    if (namespace.endsWith('.metrics')) {
      return metricTranslations[key] || key;
    }
    return progressionTranslations[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/sport-dashboard/hooks/use-sport-progression', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useSportProgression: (...args: unknown[]) => mockUseSportProgression(...args),
}));

vi.mock('./progression-chart-display', () => ({
  ProgressionChartDisplay: (props: Record<string, unknown>) => (
    <div
      data-testid="progression-chart-display"
      data-metric={props.metric as string}
      data-sport-type={props.sportType as string}
    />
  ),
}));

const runMetrics = [
  ProgressionMetric.Distance,
  ProgressionMetric.Duration,
  ProgressionMetric.Pace,
  ProgressionMetric.Sessions,
  ProgressionMetric.Elevation,
];

const rideMetrics = [
  ProgressionMetric.Distance,
  ProgressionMetric.Duration,
  ProgressionMetric.Speed,
  ProgressionMetric.Sessions,
  ProgressionMetric.Elevation,
];

const swimMetrics = [
  ProgressionMetric.Distance,
  ProgressionMetric.Duration,
  ProgressionMetric.Pace,
  ProgressionMetric.Sessions,
];

describe('ProgressionChartSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSportProgression.mockReturnValue({
      data: MOCK_PROGRESSION_DATA_WEEKLY,
      period: StatisticsPeriod.Week,
      setPeriod: mockSetPeriod,
      metric: ProgressionMetric.Distance,
      setMetric: mockSetMetric,
      availableMetrics: runMetrics,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('should render section title', () => {
    render(<ProgressionChartSection sportType={SportType.Run} />);

    expect(screen.getByText('My Progression')).toBeInTheDocument();
  });

  it('should render PeriodSwitch with Weekly/Monthly options', () => {
    render(<ProgressionChartSection sportType={SportType.Run} />);

    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeInTheDocument();
  });

  it('should render correct metrics for Run (no Speed)', () => {
    render(<ProgressionChartSection sportType={SportType.Run} />);

    expect(screen.getByRole('radio', { name: 'Distance' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Duration' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Pace' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sessions' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Elevation' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Speed' })).not.toBeInTheDocument();
  });

  it('should render correct metrics for Ride (no Pace)', () => {
    mockUseSportProgression.mockReturnValue({
      data: MOCK_PROGRESSION_DATA_WEEKLY,
      period: StatisticsPeriod.Week,
      setPeriod: mockSetPeriod,
      metric: ProgressionMetric.Distance,
      setMetric: mockSetMetric,
      availableMetrics: rideMetrics,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<ProgressionChartSection sportType={SportType.Ride} />);

    expect(screen.getByRole('radio', { name: 'Speed' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Pace' })).not.toBeInTheDocument();
  });

  it('should render correct metrics for Swim (no Elevation)', () => {
    mockUseSportProgression.mockReturnValue({
      data: MOCK_PROGRESSION_DATA_WEEKLY,
      period: StatisticsPeriod.Week,
      setPeriod: mockSetPeriod,
      metric: ProgressionMetric.Distance,
      setMetric: mockSetMetric,
      availableMetrics: swimMetrics,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<ProgressionChartSection sportType={SportType.Swim} />);

    expect(screen.queryByRole('radio', { name: 'Elevation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Speed' })).not.toBeInTheDocument();
  });

  it('should call setPeriod when PeriodSwitch is clicked', async () => {
    const user = userEvent.setup();
    render(<ProgressionChartSection sportType={SportType.Run} />);

    await user.click(screen.getByRole('radio', { name: 'Monthly' }));

    expect(mockSetPeriod).toHaveBeenCalledWith(StatisticsPeriod.Month);
  });

  it('should call setMetric when MetricSelector is clicked', async () => {
    const user = userEvent.setup();
    render(<ProgressionChartSection sportType={SportType.Run} />);

    await user.click(screen.getByRole('radio', { name: 'Pace' }));

    expect(mockSetMetric).toHaveBeenCalledWith(ProgressionMetric.Pace);
  });

  it('should render skeleton when loading', () => {
    mockUseSportProgression.mockReturnValue({
      data: [],
      period: StatisticsPeriod.Week,
      setPeriod: mockSetPeriod,
      metric: ProgressionMetric.Distance,
      setMetric: mockSetMetric,
      availableMetrics: runMetrics,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<ProgressionChartSection sportType={SportType.Run} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render title or chart when loading', () => {
    mockUseSportProgression.mockReturnValue({
      data: [],
      period: StatisticsPeriod.Week,
      setPeriod: mockSetPeriod,
      metric: ProgressionMetric.Distance,
      setMetric: mockSetMetric,
      availableMetrics: runMetrics,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<ProgressionChartSection sportType={SportType.Run} />);

    expect(screen.queryByText('My Progression')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progression-chart-display')).not.toBeInTheDocument();
  });

  it('should render empty state when data is empty and not loading', () => {
    mockUseSportProgression.mockReturnValue({
      data: [],
      period: StatisticsPeriod.Week,
      setPeriod: mockSetPeriod,
      metric: ProgressionMetric.Distance,
      setMetric: mockSetMetric,
      availableMetrics: runMetrics,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<ProgressionChartSection sportType={SportType.Run} />);

    expect(screen.getByText('No data available for this period')).toBeInTheDocument();
    expect(screen.queryByTestId('progression-chart-display')).not.toBeInTheDocument();
  });

  it('should render chart display when data is present', () => {
    render(<ProgressionChartSection sportType={SportType.Run} />);

    expect(screen.getByTestId('progression-chart-display')).toBeInTheDocument();
  });

  it('should have accessible section landmark', () => {
    render(<ProgressionChartSection sportType={SportType.Run} />);

    expect(screen.getByRole('region', { name: /progression/i })).toBeInTheDocument();
  });
});
