import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SportType } from '@/gql/graphql';
import type { SportDistributionItem } from '@/lib/dashboard/types';
import { SportDistribution } from './sport-distribution';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.sportDistribution': {
        title: 'Sport Distribution',
        thisMonth: 'this month',
      },
      'activities.sportTypes': {
        run: 'Running',
        ride: 'Cycling',
        swim: 'Swimming',
      },
    };
    return translations[namespace]?.[key] ?? key;
  },
}));

vi.mock('@/lib/sports/config', () => ({
  getSportIcon: () => {
    const MockIcon = (props: { className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }) => (
      <svg
        data-testid="sport-icon"
        className={props.className}
        aria-hidden={props['aria-hidden'] === true || props['aria-hidden'] === 'true' ? true : undefined}
      />
    );
    return MockIcon;
  },
  getSportColors: () => ({
    bg: 'bg-lime-300',
    bgMuted: 'bg-lime-300/10',
    text: 'text-lime-500',
    border: 'border-lime-300',
  }),
}));

describe('SportDistribution', () => {
  const mockDistribution: SportDistributionItem[] = [
    { sport: SportType.Run, percentage: 50, totalTime: 7200 },
    { sport: SportType.Ride, percentage: 30, totalTime: 4320 },
    { sport: SportType.Swim, percentage: 20, totalTime: 2880 },
  ];

  const twoSportsDistribution: SportDistributionItem[] = [
    { sport: SportType.Run, percentage: 60, totalTime: 7200 },
    { sport: SportType.Ride, percentage: 40, totalTime: 4800 },
  ];

  describe('rendering', () => {
    it('renders title and subtitle', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      expect(screen.getByText('Sport Distribution')).toBeInTheDocument();
      expect(screen.getByText('this month')).toBeInTheDocument();
    });

    it('renders pie chart icon', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      const header = screen.getByText('Sport Distribution').parentElement?.parentElement;
      expect(header?.querySelector('svg')).toBeInTheDocument();
    });

    it('renders all sports with their labels', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Cycling')).toBeInTheDocument();
      expect(screen.getByText('Swimming')).toBeInTheDocument();
    });

    it('renders sport icons for each sport', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      const icons = screen.getAllByTestId('sport-icon');
      expect(icons).toHaveLength(3);
    });

    it('renders percentages for each sport', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });

  describe('progress bars', () => {
    it('renders progress bars with correct aria values', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);

      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '50');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '30');
      expect(progressBars[2]).toHaveAttribute('aria-valuenow', '20');
    });

    it('has correct accessibility attributes on progress bars', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      const progressBars = screen.getAllByRole('progressbar');

      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuemin', '0');
        expect(bar).toHaveAttribute('aria-valuemax', '100');
      });
    });
  });

  describe('duration display', () => {
    it('displays formatted duration for each sport', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      expect(screen.getByText('2h')).toBeInTheDocument();
      expect(screen.getByText('1h 12m')).toBeInTheDocument();
      expect(screen.getByText('48m')).toBeInTheDocument();
    });

    it('displays total time', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('4h')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('sorts distribution by percentage descending', () => {
      const unsortedDistribution: SportDistributionItem[] = [
        { sport: SportType.Swim, percentage: 20, totalTime: 2880 },
        { sport: SportType.Run, percentage: 50, totalTime: 7200 },
        { sport: SportType.Ride, percentage: 30, totalTime: 4320 },
      ];

      render(<SportDistribution distribution={unsortedDistribution} />);

      const sportNames = screen.getAllByText(/Running|Cycling|Swimming/);
      expect(sportNames[0]).toHaveTextContent('Running');
      expect(sportNames[1]).toHaveTextContent('Cycling');
      expect(sportNames[2]).toHaveTextContent('Swimming');
    });
  });

  describe('conditional rendering (returns null when <= 1 sport)', () => {
    it('returns null when distribution is empty', () => {
      const { container } = render(<SportDistribution distribution={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null when only one sport', () => {
      const singleSport: SportDistributionItem[] = [{ sport: SportType.Run, percentage: 100, totalTime: 10800 }];

      const { container } = render(<SportDistribution distribution={singleSport} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders when exactly two sports', () => {
      render(<SportDistribution distribution={twoSportsDistribution} />);

      expect(screen.getByText('Sport Distribution')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Cycling')).toBeInTheDocument();
    });

    it('renders when three or more sports', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      expect(screen.getByText('Sport Distribution')).toBeInTheDocument();
      expect(screen.getAllByTestId('sport-icon')).toHaveLength(3);
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(<SportDistribution distribution={mockDistribution} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('uses h-full for flexible height', () => {
      const { container } = render(<SportDistribution distribution={mockDistribution} />);

      expect(container.firstChild).toHaveClass('h-full');
    });

    it('uses flex column layout', () => {
      const { container } = render(<SportDistribution distribution={mockDistribution} />);

      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('flex-col');
    });
  });

  describe('accessibility', () => {
    it('has aria-hidden on decorative icons', () => {
      render(<SportDistribution distribution={mockDistribution} />);

      const icons = screen.getAllByTestId('sport-icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
