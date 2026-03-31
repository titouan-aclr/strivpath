import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalList } from './goal-list';
import { GoalStatus, GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { GoalCardFragment } from '@/gql/graphql';

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const fullKey = namespace ? `${namespace}.${key}` : key;
  const translations: Record<string, string> = {
    'goals.error.title': 'Error loading goals',
    'goals.error.description': 'Unable to load your goals. Please try again.',
    'goals.error.retry': 'Retry',
    'goals.empty.title': 'No goals yet',
    'goals.empty.description': 'Start by creating your first goal',
    'goals.empty.createButton': 'Create Goal',
  };
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="create-goal-link">
      {children}
    </a>
  ),
}));

vi.mock('./goal-card', () => ({
  GoalCard: ({ goal, disabled }: { goal: GoalCardFragment; disabled: boolean }) => (
    <div data-testid={`goal-card-${goal.id}`} data-disabled={disabled}>
      {goal.title}
    </div>
  ),
}));

vi.mock('./goal-list-skeleton', () => ({
  GoalListSkeleton: ({ count }: { count: number }) => (
    <div data-testid="goal-list-skeleton" data-count={count}>
      Loading...
    </div>
  ),
}));

const createMockGoal = (overrides?: Partial<GoalCardFragment>): GoalCardFragment => ({
  __typename: 'Goal' as const,
  id: '1',
  title: 'Run 50km',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  currentValue: 30,
  progressPercentage: 60,
  status: GoalStatus.Active,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  description: null,
  isRecurring: false,
  isExpired: false,
  daysRemaining: 15,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('GoalList', () => {
  const mockOnArchive = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display skeleton when loading and no goals', () => {
      render(
        <GoalList
          goals={[]}
          loading={true}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      expect(screen.getByTestId('goal-list-skeleton')).toBeInTheDocument();
      expect(screen.getByTestId('goal-list-skeleton')).toHaveAttribute('data-count', '6');
    });

    it('should not display skeleton when loading with existing goals', () => {
      const goals = [createMockGoal()];
      render(
        <GoalList
          goals={goals}
          loading={true}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      expect(screen.queryByTestId('goal-list-skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('goal-card-1')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error card with title and description', () => {
      render(
        <GoalList
          goals={[]}
          loading={false}
          error={new Error('Test error')}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      expect(screen.getByText('Error loading goals')).toBeInTheDocument();
      expect(screen.getByText('Unable to load your goals. Please try again.')).toBeInTheDocument();
    });

    it('should display retry button in error state', () => {
      render(
        <GoalList
          goals={[]}
          loading={false}
          error={new Error('Test error')}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call onRefetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <GoalList
          goals={[]}
          loading={false}
          error={new Error('Test error')}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnRefetch).toHaveBeenCalledTimes(1);
    });

    it('should display error icon', () => {
      const { container } = render(
        <GoalList
          goals={[]}
          loading={false}
          error={new Error('Test error')}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty state when no loading and no goals', () => {
      render(
        <GoalList
          goals={[]}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      expect(screen.getByText('No goals yet')).toBeInTheDocument();
      expect(screen.getByText('Start by creating your first goal')).toBeInTheDocument();
    });

    it('should display create button in empty state', () => {
      render(
        <GoalList
          goals={[]}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      const createButton = screen.getByRole('link', { name: /create goal/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute('href', '/goals/new');
    });

    it('should display empty state icon', () => {
      const { container } = render(
        <GoalList
          goals={[]}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      const icon = container.querySelector('svg[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('should display goal cards in grid layout', () => {
      const goals = [
        createMockGoal({ id: '1', title: 'Goal 1' }),
        createMockGoal({ id: '2', title: 'Goal 2' }),
        createMockGoal({ id: '3', title: 'Goal 3' }),
      ];

      const { container } = render(
        <GoalList
          goals={goals}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      expect(screen.getByTestId('goal-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('goal-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('goal-card-3')).toBeInTheDocument();

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
    });

    it('should pass correct props to goal cards', () => {
      const goals = [createMockGoal({ id: '1', title: 'Test Goal' })];

      render(
        <GoalList
          goals={goals}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      const goalCard = screen.getByTestId('goal-card-1');
      expect(goalCard).toHaveAttribute('data-disabled', 'false');
      expect(goalCard).toHaveTextContent('Test Goal');
    });

    it('should disable goal cards when archiving', () => {
      const goals = [createMockGoal({ id: '1' })];

      render(
        <GoalList
          goals={goals}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={true}
          isDeleting={false}
        />,
      );

      const goalCard = screen.getByTestId('goal-card-1');
      expect(goalCard).toHaveAttribute('data-disabled', 'true');
    });

    it('should disable goal cards when deleting', () => {
      const goals = [createMockGoal({ id: '1' })];

      render(
        <GoalList
          goals={goals}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={true}
        />,
      );

      const goalCard = screen.getByTestId('goal-card-1');
      expect(goalCard).toHaveAttribute('data-disabled', 'true');
    });

    it('should render multiple goal cards', () => {
      const goals = [
        createMockGoal({ id: '1', title: 'Goal 1' }),
        createMockGoal({ id: '2', title: 'Goal 2' }),
        createMockGoal({ id: '3', title: 'Goal 3' }),
        createMockGoal({ id: '4', title: 'Goal 4' }),
        createMockGoal({ id: '5', title: 'Goal 5' }),
      ];

      render(
        <GoalList
          goals={goals}
          loading={false}
          onArchive={mockOnArchive}
          onDelete={mockOnDelete}
          onRefetch={mockOnRefetch}
          isArchiving={false}
          isDeleting={false}
        />,
      );

      expect(screen.getAllByTestId(/goal-card-/)).toHaveLength(5);
    });
  });
});
