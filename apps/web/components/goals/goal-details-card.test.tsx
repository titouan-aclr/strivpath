import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalDetailsCard } from './goal-details-card';
import { GoalStatus, GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { Goal } from '@/gql/graphql';

const mockUseLocale = () => 'en-US';

const mockUseTranslations = (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    'goals.detail.information': 'Goal Information',
    'goals.detail.period': 'Period',
    'goals.detail.daysRemaining': 'Days Remaining',
    'goals.detail.daysRemainingValue': '{days} days left',
    'goals.detail.target': 'Target',
    'goals.detail.sport': 'Sport',
    'goals.detail.allSports': 'All Sports',
    'goals.detail.createdAt': 'Created',
    'goals.detail.updatedAt': 'Updated',
    'goals.sportTypes.run': 'Running',
    'goals.sportTypes.ride': 'Cycling',
    'goals.sportTypes.swim': 'Swimming',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  let translation = translations[fullKey] || key;

  if (values?.days !== undefined && typeof values.days === 'number') {
    translation = translation.replace('{days}', values.days.toString());
  }

  return translation;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
  useLocale: () => mockUseLocale(),
}));

const createMockGoal = (overrides?: Partial<Goal>): Goal => ({
  __typename: 'Goal' as const,
  id: '1',
  title: 'Run 50km',
  description: 'Monthly running goal',
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2024-01-31T00:00:00.000Z'),
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  currentValue: 30,
  progressPercentage: 60,
  status: GoalStatus.Active,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  isRecurring: false,
  isExpired: false,
  daysRemaining: 15,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-15T00:00:00.000Z'),
  completedAt: null,
  recurrenceEndDate: null,
  templateId: null,
  userId: 1,
  ...overrides,
});

describe('GoalDetailsCard', () => {
  it('should render card title', () => {
    const goal = createMockGoal();
    render(<GoalDetailsCard goal={goal} />);

    expect(screen.getByText('Goal Information')).toBeInTheDocument();
  });

  describe('period row', () => {
    it('should display period with formatted dates', () => {
      const goal = createMockGoal({
        startDate: new Date('2024-03-01T00:00:00.000Z'),
        endDate: new Date('2024-03-31T00:00:00.000Z'),
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('Period')).toBeInTheDocument();
      const periodValue = screen.getByText(/Mar.*-.*Mar/i);
      expect(periodValue).toBeInTheDocument();
    });
  });

  describe('days remaining row', () => {
    it('should display days remaining when goal is not expired', () => {
      const goal = createMockGoal({
        isExpired: false,
        daysRemaining: 10,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('Days Remaining')).toBeInTheDocument();
      expect(screen.getByText(/10 days left/i)).toBeInTheDocument();
    });

    it('should not display days remaining when goal is expired', () => {
      const goal = createMockGoal({
        isExpired: true,
        daysRemaining: 0,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.queryByText('Days Remaining')).not.toBeInTheDocument();
    });

    it('should not display days remaining when daysRemaining is null', () => {
      const goal = createMockGoal({
        isExpired: false,
        daysRemaining: null,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.queryByText('Days Remaining')).not.toBeInTheDocument();
    });

    it('should highlight days remaining value with strava-orange', () => {
      const goal = createMockGoal({
        isExpired: false,
        daysRemaining: 5,
      });
      const { container } = render(<GoalDetailsCard goal={goal} />);

      const highlightedText = container.querySelector('.text-strava-orange');
      expect(highlightedText).toBeInTheDocument();
    });
  });

  describe('target row', () => {
    it('should display target value for DISTANCE', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Distance,
        targetValue: 100,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('Target')).toBeInTheDocument();
      expect(screen.getByText('100 km')).toBeInTheDocument();
    });

    it('should display target value for DURATION', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Duration,
        targetValue: 20,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('20 hours')).toBeInTheDocument();
    });

    it('should display target value for ELEVATION', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Elevation,
        targetValue: 5000,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('5000 meters')).toBeInTheDocument();
    });

    it('should display target value for FREQUENCY', () => {
      const goal = createMockGoal({
        targetType: GoalTargetType.Frequency,
        targetValue: 12,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('12 sessions')).toBeInTheDocument();
    });
  });

  describe('sport row', () => {
    it('should display sport label for RUN', () => {
      const goal = createMockGoal({
        sportType: SportType.Run,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('Sport')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should display sport label for RIDE', () => {
      const goal = createMockGoal({
        sportType: SportType.Ride,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('Cycling')).toBeInTheDocument();
    });

    it('should display sport label for SWIM', () => {
      const goal = createMockGoal({
        sportType: SportType.Swim,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('Swimming')).toBeInTheDocument();
    });

    it('should display "All Sports" when sportType is null', () => {
      const goal = createMockGoal({
        sportType: null,
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText('All Sports')).toBeInTheDocument();
    });

    it('should render sport icon', () => {
      const goal = createMockGoal({
        sportType: SportType.Run,
      });
      const { container } = render(<GoalDetailsCard goal={goal} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('metadata section', () => {
    it('should display creation date', () => {
      const goal = createMockGoal({
        createdAt: new Date('2024-01-15T00:00:00.000Z'),
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText(/Created/i)).toBeInTheDocument();
    });

    it('should display updated date', () => {
      const goal = createMockGoal({
        updatedAt: new Date('2024-01-20T00:00:00.000Z'),
      });
      render(<GoalDetailsCard goal={goal} />);

      expect(screen.getByText(/Updated/i)).toBeInTheDocument();
    });

    it('should format dates with locale', () => {
      const goal = createMockGoal({
        createdAt: new Date('2024-03-10T00:00:00.000Z'),
        updatedAt: new Date('2024-03-20T00:00:00.000Z'),
      });
      const { container } = render(<GoalDetailsCard goal={goal} />);

      const metadataSection = container.querySelector('.text-xs');
      expect(metadataSection).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should render all detail rows with icons', () => {
      const goal = createMockGoal();
      const { container } = render(<GoalDetailsCard goal={goal} />);

      const iconContainers = container.querySelectorAll('.bg-muted');
      expect(iconContainers.length).toBeGreaterThanOrEqual(4);
    });

    it('should render separator', () => {
      const goal = createMockGoal();
      const { container } = render(<GoalDetailsCard goal={goal} />);

      const separator = container.querySelector('[data-orientation="horizontal"]');
      expect(separator).toBeInTheDocument();
    });
  });
});
