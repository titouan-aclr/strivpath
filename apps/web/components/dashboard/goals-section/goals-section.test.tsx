import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalTargetType, GoalStatus, SportType } from '@/gql/graphql';
import { GoalsSection } from './goals-section';
import type { DashboardGoal } from '@/lib/dashboard/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Goals',
      viewAll: 'View all',
      'empty.title': 'Set your first goal',
      'empty.description': 'Track your progress and stay motivated',
      'empty.cta': 'Create a goal',
      ahead: 'Ahead',
      behind: 'Behind',
      onTrack: 'On track',
    };
    return translations[key] || key;
  },
}));

vi.mock('@/lib/dashboard/utils', () => ({
  getProgressStatusFromGoal: vi.fn().mockReturnValue('onTrack'),
}));

vi.mock('./primary-goal-card', () => ({
  PrimaryGoalCard: ({ goal }: { goal: DashboardGoal }) => (
    <div data-testid="primary-goal-card" data-goal-id={goal.id}>
      Primary: {goal.title}
    </div>
  ),
}));

vi.mock('./secondary-goal-card', () => ({
  SecondaryGoalCard: ({ goal }: { goal: DashboardGoal }) => (
    <div data-testid="secondary-goal-card" data-goal-id={goal.id}>
      Secondary: {goal.title}
    </div>
  ),
}));

vi.mock('./goals-empty-state', () => ({
  GoalsEmptyState: () => <div data-testid="goals-empty-state">Empty State</div>,
}));

const createMockGoal = (id: string, title: string, overrides: Partial<DashboardGoal> = {}): DashboardGoal => ({
  id,
  title,
  targetType: GoalTargetType.Distance,
  targetValue: 100,
  currentValue: 50,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  sportType: SportType.Run,
  status: GoalStatus.Active,
  progressPercentage: 50,
  daysRemaining: 10,
  isExpired: false,
  progressHistory: [],
  ...overrides,
});

describe('GoalsSection', () => {
  it('should render section title', () => {
    render(<GoalsSection goals={[createMockGoal('1', 'Goal 1')]} />);

    expect(screen.getByText('Goals')).toBeInTheDocument();
  });

  it('should render view all link', () => {
    render(<GoalsSection goals={[createMockGoal('1', 'Goal 1')]} />);

    const link = screen.getByRole('link', { name: /View all/i });
    expect(link).toHaveAttribute('href', '/goals');
  });

  it('should render empty state when no goals', () => {
    render(<GoalsSection goals={[]} />);

    expect(screen.getByTestId('goals-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('primary-goal-card')).not.toBeInTheDocument();
  });

  it('should render primary goal card for first goal', () => {
    render(<GoalsSection goals={[createMockGoal('1', 'Primary Goal')]} />);

    const primaryCard = screen.getByTestId('primary-goal-card');
    expect(primaryCard).toBeInTheDocument();
    expect(primaryCard).toHaveAttribute('data-goal-id', '1');
  });

  it('should render secondary goal cards for remaining goals', () => {
    render(
      <GoalsSection
        goals={[
          createMockGoal('1', 'Primary Goal'),
          createMockGoal('2', 'Secondary Goal 1'),
          createMockGoal('3', 'Secondary Goal 2'),
        ]}
      />,
    );

    const secondaryCards = screen.getAllByTestId('secondary-goal-card');
    expect(secondaryCards).toHaveLength(2);
    expect(secondaryCards[0]).toHaveAttribute('data-goal-id', '2');
    expect(secondaryCards[1]).toHaveAttribute('data-goal-id', '3');
  });

  it('should render only primary card when single goal', () => {
    render(<GoalsSection goals={[createMockGoal('1', 'Only Goal')]} />);

    expect(screen.getByTestId('primary-goal-card')).toBeInTheDocument();
    expect(screen.queryByTestId('secondary-goal-card')).not.toBeInTheDocument();
  });

  it('should render 1 primary and 2 secondary cards for 3 goals', () => {
    render(
      <GoalsSection
        goals={[createMockGoal('1', 'Goal 1'), createMockGoal('2', 'Goal 2'), createMockGoal('3', 'Goal 3')]}
      />,
    );

    expect(screen.getAllByTestId('primary-goal-card')).toHaveLength(1);
    expect(screen.getAllByTestId('secondary-goal-card')).toHaveLength(2);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <GoalsSection goals={[createMockGoal('1', 'Goal 1')]} className="custom-goals-section" />,
    );

    expect(container.querySelector('.custom-goals-section')).toBeInTheDocument();
  });

  it('should not show view all link when empty', () => {
    render(<GoalsSection goals={[]} />);

    expect(screen.queryByRole('link', { name: /View all/i })).not.toBeInTheDocument();
  });

  it('should render title in empty state card', () => {
    render(<GoalsSection goals={[]} />);

    const titles = screen.getAllByText('Goals');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });
});
