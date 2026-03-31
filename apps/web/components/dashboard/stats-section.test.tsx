import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsSection } from './stats-section';
import { StatisticsPeriod } from '@/lib/dashboard/types';
import type { PeriodStats } from '@/lib/dashboard/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Statistics',
      totalTime: 'Training Time',
      activityCount: 'Activities',
      averageTime: 'Avg. per Session',
      'periods.week': 'Week',
      'periods.month': 'Month',
      'periods.year': 'Year',
    };
    return translations[key] || key;
  },
}));

describe('StatsSection', () => {
  const mockStatistics: PeriodStats = {
    totalTime: 7200,
    activityCount: 5,
    averageTimePerSession: 1440,
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-07'),
  };

  it('should render section title', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('should render all stat cards', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('Training Time')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Avg. per Session')).toBeInTheDocument();
  });

  it('should render period switch with all options', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Year' })).toBeInTheDocument();
  });

  it('should select current period in switch', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Month} onPeriodChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'false');
  });

  it('should call onPeriodChange when period is selected', async () => {
    const user = userEvent.setup();
    const handlePeriodChange = vi.fn();
    render(
      <StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={handlePeriodChange} />,
    );

    await user.click(screen.getByRole('radio', { name: 'Month' }));

    expect(handlePeriodChange).toHaveBeenCalledWith(StatisticsPeriod.Month);
  });

  it('should format total time correctly', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('should display activity count', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should format average time correctly', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('24m')).toBeInTheDocument();
  });

  it('should show dash when statistics is null', () => {
    render(<StatsSection statistics={null} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('should show zero for activity count when null', () => {
    render(<StatsSection statistics={null} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    const { container } = render(
      <StatsSection statistics={null} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} loading />,
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render stat cards when loading', () => {
    render(
      <StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} loading />,
    );

    expect(screen.queryByText('Training Time')).not.toBeInTheDocument();
  });

  it('should have accessible section landmark', () => {
    render(<StatsSection statistics={mockStatistics} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByRole('region', { name: /statistics/i })).toBeInTheDocument();
  });

  it('should handle statistics with zero values', () => {
    const zeroStats: PeriodStats = {
      totalTime: 0,
      activityCount: 0,
      averageTimePerSession: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
    };

    render(<StatsSection statistics={zeroStats} period={StatisticsPeriod.Week} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('0h')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle large values', () => {
    const largeStats: PeriodStats = {
      totalTime: 360000,
      activityCount: 150,
      averageTimePerSession: 2400,
      periodStart: new Date(),
      periodEnd: new Date(),
    };

    render(<StatsSection statistics={largeStats} period={StatisticsPeriod.Year} onPeriodChange={vi.fn()} />);

    expect(screen.getByText('100h')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('40m')).toBeInTheDocument();
  });
});
