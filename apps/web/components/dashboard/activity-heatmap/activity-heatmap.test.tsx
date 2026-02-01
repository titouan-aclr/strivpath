import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityCalendarDay } from '@/lib/dashboard/types';
import { ActivityHeatmap } from './activity-heatmap';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { count?: number }) => {
    const translations: Record<string, string> = {
      title: 'Activity Calendar',
      totalActivities: `${String(values?.count ?? 0)} activities`,
      thisYear: 'this year',
      'legend.noActivity': 'No activity',
      'legend.withActivity': 'With activity',
    };
    return translations[key] ?? key;
  },
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: unknown }) => children,
  TooltipTrigger: ({ children }: { children: unknown }) => children,
}));

function createCalendarData(dates: string[]): ActivityCalendarDay[] {
  return dates.map(dateStr => ({
    date: new Date(dateStr),
    hasActivity: true,
  }));
}

describe('ActivityHeatmap', () => {
  const currentYear = new Date().getFullYear();

  const mockCalendarData = createCalendarData([
    `${currentYear}-01-15`,
    `${currentYear}-01-20`,
    `${currentYear}-02-10`,
    `${currentYear}-06-05`,
    `${currentYear}-06-10`,
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with title', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} />);

      expect(screen.getByText('Activity Calendar')).toBeInTheDocument();
    });

    it('renders calendar icon', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} />);

      const title = screen.getByText('Activity Calendar');
      const container = title.parentElement?.parentElement;
      expect(container?.querySelector('svg')).toBeInTheDocument();
    });

    it('displays activity count for the year', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} year={currentYear} />);

      expect(screen.getByText(/5 activities/)).toBeInTheDocument();
      expect(screen.getByText(/this year/)).toBeInTheDocument();
    });

    it('renders month labels', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} year={currentYear} />);

      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Jun')).toBeInTheDocument();
      expect(screen.getByText('Dec')).toBeInTheDocument();
    });

    it('renders day labels', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} />);

      expect(screen.getByText('M')).toBeInTheDocument();
      expect(screen.getByText('W')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('renders legend', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} />);

      expect(screen.getByText('No activity')).toBeInTheDocument();
      expect(screen.getByText('With activity')).toBeInTheDocument();
    });
  });

  describe('activity display', () => {
    it('displays cells with activity styling', () => {
      const singleActivity = createCalendarData([`${currentYear}-01-15`]);
      render(<ActivityHeatmap calendarData={singleActivity} year={currentYear} />);

      const cells = document.querySelectorAll('.bg-strava-orange');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('displays cells without activity styling', () => {
      render(<ActivityHeatmap calendarData={[]} year={currentYear} />);

      const cells = document.querySelectorAll('.bg-muted');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('counts only activities from the specified year', () => {
      const mixedYearData = createCalendarData([
        `${currentYear}-01-15`,
        `${currentYear}-01-20`,
        `${currentYear - 1}-12-25`,
      ]);

      render(<ActivityHeatmap calendarData={mixedYearData} year={currentYear} />);

      expect(screen.getByText(/2 activities/)).toBeInTheDocument();
    });
  });

  describe('year handling', () => {
    it('uses current year when year prop is not provided', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} />);

      expect(screen.getByText('Jan')).toBeInTheDocument();
    });

    it('uses provided year prop', () => {
      const pastYearData = createCalendarData(['2023-06-15']);
      render(<ActivityHeatmap calendarData={pastYearData} year={2023} />);

      expect(screen.getByText(/1 activities/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty calendar data', () => {
      render(<ActivityHeatmap calendarData={[]} />);

      expect(screen.getByText('Activity Calendar')).toBeInTheDocument();
      expect(screen.getByText(/0 activities/)).toBeInTheDocument();
    });

    it('handles single activity', () => {
      const singleActivity = createCalendarData([`${currentYear}-03-15`]);
      render(<ActivityHeatmap calendarData={singleActivity} year={currentYear} />);

      expect(screen.getByText(/1 activities/)).toBeInTheDocument();
    });

    it('handles activities on date boundaries', () => {
      const boundaryData = createCalendarData([`${currentYear}-01-01`, `${currentYear}-12-31`]);

      render(<ActivityHeatmap calendarData={boundaryData} year={currentYear} />);

      expect(screen.getByText(/2 activities/)).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<ActivityHeatmap calendarData={mockCalendarData} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has overflow hidden for scrollable content', () => {
      const { container } = render(<ActivityHeatmap calendarData={mockCalendarData} />);

      expect(container.firstChild).toHaveClass('overflow-hidden');
    });

    it('uses h-full for flexible height', () => {
      const { container } = render(<ActivityHeatmap calendarData={mockCalendarData} />);

      expect(container.firstChild).toHaveClass('h-full');
    });
  });

  describe('accessibility', () => {
    it('has aria-labels on activity cells', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} />);

      const cellsWithActivity = document.querySelectorAll('[aria-label="With activity"]');
      const cellsWithoutActivity = document.querySelectorAll('[aria-label="No activity"]');

      expect(cellsWithActivity.length).toBeGreaterThan(0);
      expect(cellsWithoutActivity.length).toBeGreaterThan(0);
    });

    it('has aria-hidden on decorative icon', () => {
      render(<ActivityHeatmap calendarData={mockCalendarData} />);

      const icon = document.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });
});
