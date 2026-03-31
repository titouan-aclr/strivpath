import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SportGoalsSection } from './sport-goals-section';
import { SportType, GoalStatus, GoalTargetType, GoalPeriodType } from '@/gql/graphql';
import type { GoalCardFragment } from '@/gql/graphql';

const mockUseSportGoals = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Goals',
      viewAll: 'View all goals',
      'empty.title': 'No goals yet',
      'empty.description': 'Set goals to track your progress and stay motivated.',
      'empty.cta': 'Create a goal',
    };
    return translations[key] || key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/sport-dashboard/hooks/use-sport-goals', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useSportGoals: (...args: unknown[]) => mockUseSportGoals(...args),
}));

vi.mock('@/components/dashboard/goals-section/primary-goal-card', () => ({
  PrimaryGoalCard: ({ goal, sportColor }: { goal: { id: string; title: string }; sportColor?: unknown }) => (
    <div
      data-testid="primary-goal-card"
      data-goal-id={goal.id}
      data-goal-title={goal.title}
      data-has-sport-color={!!sportColor}
    >
      {goal.title}
    </div>
  ),
}));

vi.mock('@/components/dashboard/goals-section/secondary-goal-card', () => ({
  SecondaryGoalCard: ({ goal, sportColor }: { goal: { id: string; title: string }; sportColor?: unknown }) => (
    <div
      data-testid="secondary-goal-card"
      data-goal-id={goal.id}
      data-goal-title={goal.title}
      data-has-sport-color={!!sportColor}
    >
      {goal.title}
    </div>
  ),
}));

function createMockGoal(overrides: Partial<GoalCardFragment> = {}): GoalCardFragment {
  return {
    __typename: 'Goal',
    id: '1',
    title: 'Run 50km',
    targetType: GoalTargetType.Distance,
    targetValue: 50000,
    periodType: GoalPeriodType.Monthly,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    isRecurring: false,
    sportType: SportType.Run,
    status: GoalStatus.Active,
    currentValue: 25000,
    progressPercentage: 50,
    isExpired: false,
    daysRemaining: 15,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

describe('SportGoalsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the section title', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: createMockGoal(),
      secondaryGoals: [],
      hasGoals: true,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.getByText('Goals')).toBeInTheDocument();
  });

  it('should render the "View all" link with sport filter', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: createMockGoal(),
      secondaryGoals: [],
      hasGoals: true,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    const link = screen.getByText('View all goals').closest('a');
    expect(link).toHaveAttribute('href', '/goals?sport=RUN');
  });

  it('should render 1 PrimaryGoalCard and 2 SecondaryGoalCards with 3+ goals', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: createMockGoal({ id: '1', title: 'Primary Goal' }),
      secondaryGoals: [
        createMockGoal({ id: '2', title: 'Secondary Goal 1' }),
        createMockGoal({ id: '3', title: 'Secondary Goal 2' }),
      ],
      hasGoals: true,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.getByTestId('primary-goal-card')).toBeInTheDocument();
    expect(screen.getAllByTestId('secondary-goal-card')).toHaveLength(2);
  });

  it('should render 1 PrimaryGoalCard and no SecondaryGoalCards with 1 goal', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: createMockGoal({ id: '1', title: 'Only Goal' }),
      secondaryGoals: [],
      hasGoals: true,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.getByTestId('primary-goal-card')).toBeInTheDocument();
    expect(screen.queryByTestId('secondary-goal-card')).not.toBeInTheDocument();
  });

  it('should render the empty state with CTA when no goals', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: null,
      secondaryGoals: [],
      hasGoals: false,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.getByText('No goals yet')).toBeInTheDocument();
    expect(screen.getByText('Set goals to track your progress and stay motivated.')).toBeInTheDocument();
    const ctaLink = screen.getByText('Create a goal').closest('a');
    expect(ctaLink).toHaveAttribute('href', '/goals/new');
  });

  it('should pass sportColor to sub-components', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: createMockGoal({ id: '1' }),
      secondaryGoals: [createMockGoal({ id: '2' })],
      hasGoals: true,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.getByTestId('primary-goal-card')).toHaveAttribute('data-has-sport-color', 'true');
    expect(screen.getByTestId('secondary-goal-card')).toHaveAttribute('data-has-sport-color', 'true');
  });

  it('should render skeleton when loading', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: null,
      secondaryGoals: [],
      hasGoals: false,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<SportGoalsSection sportType={SportType.Run} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render goal cards when loading', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: null,
      secondaryGoals: [],
      hasGoals: false,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.queryByTestId('primary-goal-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('secondary-goal-card')).not.toBeInTheDocument();
  });

  it('should not render section landmark when loading', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: null,
      secondaryGoals: [],
      hasGoals: false,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('should have an accessible section landmark', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: createMockGoal(),
      secondaryGoals: [],
      hasGoals: true,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(<SportGoalsSection sportType={SportType.Run} />);

    expect(screen.getByRole('region', { name: /goals/i })).toBeInTheDocument();
  });

  it('should use sport-specific colors in empty state', () => {
    mockUseSportGoals.mockReturnValue({
      primaryGoal: null,
      secondaryGoals: [],
      hasGoals: false,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { container } = render(<SportGoalsSection sportType={SportType.Run} />);

    expect(container.querySelector('.bg-lime-300\\/10')).toBeInTheDocument();
    expect(container.querySelector('.text-lime-500')).toBeInTheDocument();
  });
});
