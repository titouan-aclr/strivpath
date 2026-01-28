import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalTargetType, GoalStatus, SportType } from '@/gql/graphql';
import { PrimaryGoalCard } from './primary-goal-card';
import type { DashboardGoal } from '@/lib/dashboard/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
      ahead: 'Ahead',
      behind: 'Behind',
      onTrack: 'On track',
      oneMore: 'One more to go!',
      remaining: '3 remaining',
      completed: 'Completed!',
      progressComplete: `${values?.percentage}% complete`,
      'daysRemaining.expired': 'Expired',
      'daysRemaining.today': 'Ends today',
      'daysRemaining.tomorrow': '1 day left',
      'daysRemaining.days': `${values?.count} days left`,
    };
    return translations[key] || key;
  },
}));

vi.mock('@/lib/dashboard/utils', () => ({
  getProgressStatusFromGoal: vi.fn().mockReturnValue('ahead'),
}));

vi.mock('./goal-progress-chart', () => ({
  GoalProgressChart: ({ targetValue, unit }: { targetValue: number; unit: string }) => (
    <div data-testid="goal-progress-chart" data-target={targetValue} data-unit={unit}>
      Chart
    </div>
  ),
}));

vi.mock('./session-dots-progress', () => ({
  SessionDotsProgress: ({ current, target }: { current: number; target: number }) => (
    <div data-testid="session-dots-progress" data-current={current} data-target={target}>
      Dots
    </div>
  ),
}));

vi.mock('./circular-progress', () => ({
  CircularProgress: ({ percentage }: { percentage: number }) => (
    <div data-testid="circular-progress" data-percentage={percentage}>
      Circle
    </div>
  ),
}));

const createMockGoal = (overrides: Partial<DashboardGoal> = {}): DashboardGoal => ({
  id: '1',
  title: 'Monthly Running Goal',
  targetType: GoalTargetType.Distance,
  targetValue: 100,
  currentValue: 65,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  sportType: SportType.Run,
  status: GoalStatus.Active,
  progressPercentage: 65,
  daysRemaining: 10,
  isExpired: false,
  progressHistory: [
    { date: new Date('2024-01-05'), value: 20 },
    { date: new Date('2024-01-15'), value: 65 },
  ],
  ...overrides,
});

describe('PrimaryGoalCard', () => {
  it('should render goal title', () => {
    render(<PrimaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('Monthly Running Goal')).toBeInTheDocument();
  });

  it('should render days remaining text', () => {
    render(<PrimaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('10 days left')).toBeInTheDocument();
  });

  it('should render progress values', () => {
    render(<PrimaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('65.0')).toBeInTheDocument();
    expect(screen.getByText(/\/ 100\.0 km/)).toBeInTheDocument();
  });

  it('should render progress percentage', () => {
    render(<PrimaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('65.0% complete')).toBeInTheDocument();
  });

  it('should render progress status badge', () => {
    render(<PrimaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByText('Ahead')).toBeInTheDocument();
  });

  it('should link to goal detail page', () => {
    render(<PrimaryGoalCard goal={createMockGoal({ id: 'goal-456' })} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/goals/goal-456');
  });

  it('should render progress chart for distance goals with history', () => {
    render(<PrimaryGoalCard goal={createMockGoal()} />);

    expect(screen.getByTestId('goal-progress-chart')).toBeInTheDocument();
  });

  it('should render session dots for frequency goals', () => {
    render(
      <PrimaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Frequency,
          targetValue: 5,
          currentValue: 2,
        })}
      />,
    );

    const dots = screen.getByTestId('session-dots-progress');
    expect(dots).toBeInTheDocument();
    expect(dots).toHaveAttribute('data-current', '2');
    expect(dots).toHaveAttribute('data-target', '5');
  });

  it('should render circular progress for duration goals', () => {
    render(
      <PrimaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Duration,
          targetValue: 10,
          currentValue: 6.5,
          progressPercentage: 65,
        })}
      />,
    );

    const circle = screen.getByTestId('circular-progress');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('data-percentage', '65');
  });

  it('should render fallback progress bar when no history', () => {
    const { container } = render(
      <PrimaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Distance,
          progressHistory: [],
        })}
      />,
    );

    expect(screen.queryByTestId('goal-progress-chart')).not.toBeInTheDocument();
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('should render sport icon', () => {
    const { container } = render(<PrimaryGoalCard goal={createMockGoal()} />);

    const iconContainer = container.querySelector('.bg-strava-orange\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should render global icon when no sport type', () => {
    const { container } = render(<PrimaryGoalCard goal={createMockGoal({ sportType: null })} />);

    expect(container.querySelector('.text-strava-orange')).toBeInTheDocument();
  });

  it('should format hours for duration goals', () => {
    render(
      <PrimaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Duration,
          targetValue: 10,
          currentValue: 5.5,
        })}
      />,
    );

    expect(screen.getByText('5h 30m')).toBeInTheDocument();
    expect(screen.getByText(/\/ 10h hours/)).toBeInTheDocument();
  });

  it('should format whole hours without minutes', () => {
    render(
      <PrimaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Duration,
          targetValue: 10,
          currentValue: 5,
        })}
      />,
    );

    expect(screen.getByText('5h')).toBeInTheDocument();
  });

  it('should format minutes only when less than 1 hour', () => {
    render(
      <PrimaryGoalCard
        goal={createMockGoal({
          targetType: GoalTargetType.Duration,
          targetValue: 2,
          currentValue: 0.5,
        })}
      />,
    );

    expect(screen.getByText('30m')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<PrimaryGoalCard goal={createMockGoal()} className="custom-primary-card" />);

    expect(container.querySelector('.custom-primary-card')).toBeInTheDocument();
  });

  it('should pass correct props to GoalProgressChart', () => {
    render(<PrimaryGoalCard goal={createMockGoal()} />);

    const chart = screen.getByTestId('goal-progress-chart');
    expect(chart).toHaveAttribute('data-target', '100');
    expect(chart).toHaveAttribute('data-unit', 'km');
  });

  it('should use strava-orange colors for Active status', () => {
    const { container } = render(<PrimaryGoalCard goal={createMockGoal({ status: GoalStatus.Active })} />);

    expect(container.querySelector('.bg-strava-orange\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-strava-orange')).toBeInTheDocument();
  });

  it('should use green colors for Completed status', () => {
    const { container } = render(<PrimaryGoalCard goal={createMockGoal({ status: GoalStatus.Completed })} />);

    expect(container.querySelector('.bg-green-500\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-green-500')).toBeInTheDocument();
  });

  it('should use destructive colors for Failed status', () => {
    const { container } = render(<PrimaryGoalCard goal={createMockGoal({ status: GoalStatus.Failed })} />);

    expect(container.querySelector('.bg-destructive\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-destructive')).toBeInTheDocument();
  });

  it('should use muted colors for Archived status', () => {
    const { container } = render(<PrimaryGoalCard goal={createMockGoal({ status: GoalStatus.Archived })} />);

    expect(container.querySelector('.bg-muted-foreground\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-muted-foreground')).toBeInTheDocument();
  });
});
