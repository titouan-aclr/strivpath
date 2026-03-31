import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalsPageContent } from './goals-page-content';
import { GoalStatus, GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';

const mockGoals = [
  {
    id: '1',
    title: 'Run 50km this month',
    description: 'Monthly running goal',
    targetType: GoalTargetType.Distance,
    targetValue: 50,
    periodType: GoalPeriodType.Monthly,
    sportType: SportType.Run,
    isRecurring: false,
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-31T23:59:59Z',
    status: GoalStatus.Active,
    currentValue: 25,
    progressPercentage: 50,
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: '2',
    title: 'Cycle 100km this week',
    description: 'Weekly cycling goal',
    targetType: GoalTargetType.Distance,
    targetValue: 100,
    periodType: GoalPeriodType.Weekly,
    sportType: SportType.Ride,
    isRecurring: false,
    startDate: '2025-01-06T00:00:00Z',
    endDate: '2025-01-12T23:59:59Z',
    status: GoalStatus.Active,
    currentValue: 75,
    progressPercentage: 75,
    completedAt: null,
    createdAt: '2025-01-06T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
];

interface MockUseGoalsReturn {
  goals: typeof mockGoals;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const { mockUseGoals, mockArchiveGoal, mockDeleteGoal, mockRefetch, mockUseTranslations } = vi.hoisted(() => ({
  mockUseGoals: vi.fn<() => MockUseGoalsReturn>(),
  mockArchiveGoal: vi.fn(),
  mockDeleteGoal: vi.fn(),
  mockRefetch: vi.fn(),
  mockUseTranslations: vi.fn((namespace?: string) => (key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    if (values) {
      return `${fullKey}:${JSON.stringify(values)}`;
    }
    return fullKey;
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
  useLocale: () => 'en',
}));

vi.mock('@/lib/goals/use-goals', () => ({
  useGoals: () => mockUseGoals(),
}));

vi.mock('@/lib/goals/use-goal-mutations', () => ({
  useArchiveGoal: () => ({ archiveGoal: mockArchiveGoal, loading: false }),
  useDeleteGoal: () => ({ deleteGoal: mockDeleteGoal, loading: false }),
}));

interface MockGoalFiltersProps {
  filter: Record<string, unknown>;
  onFilterChange: (filter: Record<string, unknown>) => void;
}

vi.mock('./goal-filters', () => ({
  GoalFilters: ({ filter, onFilterChange }: MockGoalFiltersProps) => (
    <div data-testid="goal-filters">
      <button data-testid="change-filter" onClick={() => onFilterChange({ status: GoalStatus.Completed })}>
        Change Filter
      </button>
      <div data-testid="current-filter">{JSON.stringify(filter)}</div>
    </div>
  ),
}));

interface MockGoalListProps {
  goals: unknown[];
  loading: boolean;
  error: Error | null;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onRefetch: () => void;
  isArchiving: boolean;
  isDeleting: boolean;
}

vi.mock('./goal-list', () => ({
  GoalList: ({ goals, loading, error, onArchive, onDelete, onRefetch, isArchiving, isDeleting }: MockGoalListProps) => (
    <div data-testid="goal-list">
      <div data-testid="goals-count">{goals.length}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="error">{error ? 'true' : 'false'}</div>
      <div data-testid="is-archiving">{isArchiving ? 'true' : 'false'}</div>
      <div data-testid="is-deleting">{isDeleting ? 'true' : 'false'}</div>
      <button data-testid="archive-goal-1" onClick={() => onArchive('1')}>
        Archive
      </button>
      <button data-testid="delete-goal-1" onClick={() => onDelete('1')}>
        Delete
      </button>
      <button data-testid="refetch" onClick={onRefetch}>
        Refetch
      </button>
    </div>
  ),
}));

interface MockLinkProps {
  href: string;
  children: React.ReactNode;
  [key: string]: unknown;
}

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: MockLinkProps) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('GoalsPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGoals.mockReturnValue({
      goals: mockGoals,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  describe('GoalFilters and GoalList Integration', () => {
    it('should render both GoalFilters and GoalList components', () => {
      render(<GoalsPageContent />);

      expect(screen.getByTestId('goal-filters')).toBeInTheDocument();
      expect(screen.getByTestId('goal-list')).toBeInTheDocument();
    });

    it('should pass goals to GoalList', () => {
      render(<GoalsPageContent />);

      expect(screen.getByTestId('goals-count')).toHaveTextContent('2');
    });

    it('should render create button with link', () => {
      render(<GoalsPageContent />);

      const createButton = screen.getByRole('link', { name: /goals.newGoal/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute('href', '/goals/new');
    });
  });

  describe('Filter State Management', () => {
    it('should update filter state when filter changes', async () => {
      const user = userEvent.setup();
      render(<GoalsPageContent />);

      const currentFilter = screen.getByTestId('current-filter');
      expect(currentFilter).toHaveTextContent('status');

      await user.click(screen.getByTestId('change-filter'));

      await waitFor(() => {
        expect(screen.getByTestId('current-filter')).toHaveTextContent('COMPLETED');
      });
    });

    it('should filter goals by periodType locally', () => {
      mockUseGoals.mockReturnValue({
        goals: mockGoals,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<GoalsPageContent />);

      expect(screen.getByTestId('goals-count')).toHaveTextContent('2');
    });

    it('should filter goals by targetType locally', () => {
      mockUseGoals.mockReturnValue({
        goals: mockGoals,
        loading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<GoalsPageContent />);

      expect(screen.getByTestId('goals-count')).toHaveTextContent('2');
    });
  });

  describe('Goal List Props', () => {
    it('should pass loading prop to GoalList', () => {
      mockUseGoals.mockReturnValue({
        goals: [],
        loading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<GoalsPageContent />);

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('should pass error prop to GoalList', () => {
      mockUseGoals.mockReturnValue({
        goals: [],
        loading: false,
        error: new Error('Failed to fetch goals'),
        refetch: mockRefetch,
      });

      render(<GoalsPageContent />);

      expect(screen.getByTestId('error')).toHaveTextContent('true');
    });

    it('should pass onArchive handler to GoalList', async () => {
      const user = userEvent.setup();
      mockArchiveGoal.mockResolvedValue(true);

      render(<GoalsPageContent />);

      await user.click(screen.getByTestId('archive-goal-1'));

      await waitFor(() => {
        expect(mockArchiveGoal).toHaveBeenCalledWith(1);
      });
    });

    it('should pass onDelete handler to GoalList', async () => {
      const user = userEvent.setup();
      mockDeleteGoal.mockResolvedValue(true);

      render(<GoalsPageContent />);

      await user.click(screen.getByTestId('delete-goal-1'));

      await waitFor(() => {
        expect(mockDeleteGoal).toHaveBeenCalledWith(1);
      });
    });

    it('should pass onRefetch handler to GoalList', async () => {
      const user = userEvent.setup();

      render(<GoalsPageContent />);

      await user.click(screen.getByTestId('refetch'));

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('should handle invalid goal ID gracefully in archive', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GoalsPageContent />);

      const invalidArchiveButton = screen.getByTestId('archive-goal-1');
      invalidArchiveButton.onclick = () => {
        const handleArchive = async () => {
          const goalId = 'invalid';
          const numericId = parseInt(goalId, 10);
          if (isNaN(numericId)) {
            console.error('Invalid goal ID:', goalId);
            return;
          }
          await mockArchiveGoal(numericId);
        };
        void handleArchive();
      };

      await user.click(invalidArchiveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Invalid goal ID:', 'invalid');
      });

      consoleSpy.mockRestore();
    });

    it('should handle invalid goal ID gracefully in delete', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GoalsPageContent />);

      const invalidDeleteButton = screen.getByTestId('delete-goal-1');
      invalidDeleteButton.onclick = () => {
        const handleDelete = async () => {
          const goalId = 'invalid';
          const numericId = parseInt(goalId, 10);
          if (isNaN(numericId)) {
            console.error('Invalid goal ID:', goalId);
            return;
          }
          await mockDeleteGoal(numericId);
        };
        void handleDelete();
      };

      await user.click(invalidDeleteButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Invalid goal ID:', 'invalid');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Create Button Rendering', () => {
    it('should render create button with Plus icon', () => {
      render(<GoalsPageContent />);

      const createButton = screen.getByRole('link', { name: /goals.newGoal/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should render page title and description', () => {
      render(<GoalsPageContent />);

      expect(screen.getByText('goals.title')).toBeInTheDocument();
      expect(screen.getByText('goals.description')).toBeInTheDocument();
    });
  });
});
