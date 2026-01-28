import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalTargetType, GoalStatus, SportType } from '@/gql/graphql';
import { SecondaryGoalCard } from './secondary-goal-card';
import type { DashboardGoal } from '@/lib/dashboard/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
      ahead: 'Ahead',
      behind: 'Behind',
      onTrack: 'On track',
      'daysRemaining.expired': 'Expired',
      'daysRemaining.today': 'Ends today',
      'daysRemaining.tomorrow': '1 day left',
      'daysRemaining.days': `${values?.count} days left`,
    };
    return translations[key] || key;
  },
}));

vi.mock('@/lib/dashboard/utils', () => ({
  getProgressStatusFromGoal: vi.fn().mockReturnValue('onTrack'),
}));

const createMockGoal = (overrides: Partial<DashboardGoal> = {}): DashboardGoal => ({
  id: '1',
  title: 'Run 50km this month',
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  currentValue: 25,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  sportType: SportType.Run,
  status: GoalStatus.Active,
  progressPercentage: 50,
  daysRemaining: 5,
  isExpired: false,
  progressHistory: [],
  ...overrides,
});

describe('SecondaryGoalCard', () => {
  it('should render goal title', () => {
    render(<SecondaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('Run 50km this month')).toBeInTheDocument();
  });

  it('should render progress values', () => {
    render(<SecondaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText(/25\.0 \/ 50\.0 km/)).toBeInTheDocument();
  });

  it('should render progress percentage', () => {
    render(<SecondaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render days remaining text', () => {
    render(<SecondaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('5 days left')).toBeInTheDocument();
  });

  it('should render progress status badge', () => {
    render(<SecondaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('On track')).toBeInTheDocument();
  });

  it('should link to goal detail page', () => {
    render(<SecondaryGoalCard goal={createMockGoal({ id: 'goal-123' })} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/goals/goal-123');
  });

  it('should render sport icon for running', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ sportType: SportType.Run })} />);

    expect(container.querySelector('.text-strava-orange')).toBeInTheDocument();
  });

  it('should render sport icon for cycling', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ sportType: SportType.Ride })} />);

    expect(container.querySelector('.text-strava-orange')).toBeInTheDocument();
  });

  it('should render sport icon for swimming', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ sportType: SportType.Swim })} />);

    expect(container.querySelector('.text-strava-orange')).toBeInTheDocument();
  });

  it('should render global icon when no sport type', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ sportType: null })} />);

    expect(container.querySelector('.text-strava-orange')).toBeInTheDocument();
  });

  it('should cap progress bar at 100%', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ progressPercentage: 150 })} />);

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('should have progress bar with correct ARIA attributes', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ currentValue: 25, targetValue: 50 })} />);

    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '25');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '50');
  });

  it('should apply custom className', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal()} className="custom-secondary-card" />);

    expect(container.querySelector('.custom-secondary-card')).toBeInTheDocument();
  });

  it('should format integer values for frequency goals', () => {
    render(
      <SecondaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Frequency,
          currentValue: 3,
          targetValue: 5,
        })}
      />,
    );

    expect(screen.getByText(/3 \/ 5 sessions/)).toBeInTheDocument();
  });

  it('should format values with decimals for distance goals', () => {
    render(
      <SecondaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Distance,
          currentValue: 25.5,
          targetValue: 50.0,
        })}
      />,
    );

    expect(screen.getByText(/25\.5 \/ 50\.0 km/)).toBeInTheDocument();
  });

  it('should use strava-orange colors for Active status', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ status: GoalStatus.Active })} />);

    expect(container.querySelector('.bg-strava-orange\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-strava-orange')).toBeInTheDocument();
  });

  it('should use green colors for Completed status', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ status: GoalStatus.Completed })} />);

    expect(container.querySelector('.bg-green-500\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-green-500')).toBeInTheDocument();
  });

  it('should use destructive colors for Failed status', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ status: GoalStatus.Failed })} />);

    expect(container.querySelector('.bg-destructive\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-destructive')).toBeInTheDocument();
  });

  it('should use muted colors for Archived status', () => {
    const { container } = render(<SecondaryGoalCard goal={createMockGoal({ status: GoalStatus.Archived })} />);

    expect(container.querySelector('.bg-muted-foreground\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-muted-foreground')).toBeInTheDocument();
  });
});
