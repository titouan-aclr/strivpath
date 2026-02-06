import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SportStatsSection } from './sport-stats-section';
import { SportType, StatisticsPeriod } from '@/gql/graphql';
import type { SportPeriodStatistics } from '@/gql/graphql';

const mockSetPeriod = vi.fn();
const mockUseSportStats = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Statistics',
      distance: 'Distance',
      duration: 'Duration',
      sessions: 'Sessions',
      elevation: 'Elevation',
      'periods.week': 'Week',
      'periods.month': 'Month',
      'periods.year': 'Year',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/lib/sport-dashboard/hooks/use-sport-stats', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useSportStats: (...args: unknown[]) => mockUseSportStats(...args),
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

describe('SportStatsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSportStats.mockReturnValue({
      stats: mockStats,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('should render section title', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('should render 4 cards for Running', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Elevation')).toBeInTheDocument();
  });

  it('should render 3 cards for Swimming (no elevation)', () => {
    render(<SportStatsSection sportType={SportType.Swim} />);

    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.queryByText('Elevation')).not.toBeInTheDocument();
  });

  it('should render 4 cards for Cycling', () => {
    render(<SportStatsSection sportType={SportType.Ride} />);

    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Elevation')).toBeInTheDocument();
  });

  it('should render PeriodSwitch with 3 options', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByRole('radio', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Year' })).toBeInTheDocument();
  });

  it('should display formatted distance', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('42.50 km')).toBeInTheDocument();
  });

  it('should display formatted duration', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('2h 30m')).toBeInTheDocument();
  });

  it('should display session count', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should display formatted elevation', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('850 m')).toBeInTheDocument();
  });

  it('should display positive trends', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getAllByText('↑').length).toBeGreaterThan(0);
  });

  it('should display negative trends', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByText('-5.3%')).toBeInTheDocument();
    expect(screen.getAllByText('↓').length).toBeGreaterThan(0);
  });

  it('should not show trend when null', () => {
    mockUseSportStats.mockReturnValue({
      stats: { ...mockStats, distanceTrend: null, durationTrend: null, activityTrend: null, elevationTrend: null },
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    mockUseSportStats.mockReturnValue({
      stats: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<SportStatsSection sportType={SportType.Run} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render cards when loading', () => {
    mockUseSportStats.mockReturnValue({
      stats: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.queryByText('Distance')).not.toBeInTheDocument();
  });

  it('should have accessible section landmark', () => {
    render(<SportStatsSection sportType={SportType.Run} />);

    expect(screen.getByRole('region', { name: /statistics/i })).toBeInTheDocument();
  });

  it('should call setPeriod when PeriodSwitch is clicked', async () => {
    const user = userEvent.setup();
    render(<SportStatsSection sportType={SportType.Run} />);

    await user.click(screen.getByRole('radio', { name: 'Week' }));

    expect(mockSetPeriod).toHaveBeenCalledWith(StatisticsPeriod.Week);
  });

  it('should pass sportColor to StatCards', () => {
    const { container } = render(<SportStatsSection sportType={SportType.Run} />);

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
  });

  it('should handle stats null with dash values', () => {
    mockUseSportStats.mockReturnValue({
      stats: null,
      period: StatisticsPeriod.Month,
      setPeriod: mockSetPeriod,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportStatsSection sportType={SportType.Run} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(4);
  });
});
