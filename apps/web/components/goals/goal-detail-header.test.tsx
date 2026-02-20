import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalDetailHeader } from './goal-detail-header';
import { GoalStatus, GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';
import type { Goal } from '@/gql/graphql';

const mockPush = vi.fn();
const mockArchiveGoal = vi.fn();
const mockDeleteGoal = vi.fn();

const mockUseTranslations = (namespace?: string) => (key: string) => {
  const translations: Record<string, string> = {
    'goals.actions.menu': 'Actions menu',
    'goals.actions.edit': 'Edit',
    'goals.actions.archive': 'Archive',
    'goals.actions.delete': 'Delete',
    'goals.status.active': 'Active',
    'goals.status.completed': 'Completed',
    'goals.status.failed': 'Failed',
    'goals.status.archived': 'Archived',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  return translations[fullKey] || key;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/goals/use-goal-mutations', () => ({
  useArchiveGoal: () => ({
    archiveGoal: mockArchiveGoal,
    loading: false,
  }),
  useDeleteGoal: () => ({
    deleteGoal: mockDeleteGoal,
    loading: false,
  }),
}));

vi.mock('./goal-status-badge', () => ({
  GoalStatusBadge: ({ status }: { status: GoalStatus }) => {
    const labels: Record<GoalStatus, string> = {
      [GoalStatus.Active]: 'Active',
      [GoalStatus.Completed]: 'Completed',
      [GoalStatus.Failed]: 'Failed',
      [GoalStatus.Archived]: 'Archived',
    };
    return <div data-testid="status-badge">{labels[status]}</div>;
  },
}));

vi.mock('./goal-delete-dialog', () => ({
  GoalDeleteDialog: ({ open, onConfirm, goalTitle }: { open: boolean; onConfirm: () => void; goalTitle: string }) => {
    if (!open) return null;
    return (
      <div data-testid="delete-dialog">
        <p>Delete {goalTitle}?</p>
        <button onClick={onConfirm}>Confirm Delete</button>
      </div>
    );
  },
}));

const createMockGoal = (overrides?: Partial<Goal>): Goal => ({
  __typename: 'Goal' as const,
  id: '1',
  title: 'Run 50km',
  description: 'Monthly running goal',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  completedAt: null,
  recurrenceEndDate: null,
  templateId: null,
  userId: 1,
  progressHistory: [],
  ...overrides,
});

describe('GoalDetailHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render goal title', () => {
      const goal = createMockGoal({ title: 'Test Goal Title' });
      render(<GoalDetailHeader goal={goal} />);

      expect(screen.getByText('Test Goal Title')).toBeInTheDocument();
    });

    it('should render goal description when provided', () => {
      const goal = createMockGoal({ description: 'Test description' });
      render(<GoalDetailHeader goal={goal} />);

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should not render description when null', () => {
      const goal = createMockGoal({ description: null });
      const { container } = render(<GoalDetailHeader goal={goal} />);

      expect(container.querySelector('p.text-muted-foreground')).not.toBeInTheDocument();
    });

    it('should render status badge', () => {
      const goal = createMockGoal({ status: GoalStatus.Active });
      render(<GoalDetailHeader goal={goal} />);

      expect(screen.getByTestId('status-badge')).toHaveTextContent('Active');
    });

    it('should render sport icon', () => {
      const goal = createMockGoal({ sportType: SportType.Run });
      const { container } = render(<GoalDetailHeader goal={goal} />);

      const iconContainer = container.querySelector('.bg-primary\\/10');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render actions menu button', () => {
      const goal = createMockGoal();
      render(<GoalDetailHeader goal={goal} />);

      expect(screen.getByRole('button', { name: /actions menu/i })).toBeInTheDocument();
    });
  });

  describe('edit action', () => {
    it('should enable edit for ACTIVE goals', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ status: GoalStatus.Active });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable edit for COMPLETED goals', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ status: GoalStatus.Completed });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      expect(editButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable edit for FAILED goals', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ status: GoalStatus.Failed });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      expect(editButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should navigate to edit page when edit is clicked', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ id: '42', status: GoalStatus.Active });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const editButton = screen.getByRole('menuitem', { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/goals/42/edit');
      });
    });
  });

  describe('archive action', () => {
    it('should enable archive for ACTIVE goals', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ status: GoalStatus.Active });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      expect(archiveButton).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable archive for COMPLETED goals', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ status: GoalStatus.Completed });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      expect(archiveButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should call archiveGoal when clicked', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ id: '42', status: GoalStatus.Active });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      await user.click(archiveButton);

      await waitFor(() => {
        expect(mockArchiveGoal).toHaveBeenCalledWith(42);
      });
    });

    it('should handle invalid goal ID gracefully', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ id: 'invalid', status: GoalStatus.Active });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const archiveButton = screen.getByRole('menuitem', { name: /archive/i });
      await user.click(archiveButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Invalid goal ID:', 'invalid');
        expect(mockArchiveGoal).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('delete action', () => {
    it('should show delete button in menu', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal();
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
    });

    it('should open delete dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ title: 'My Goal' });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete My Goal?')).toBeInTheDocument();
      });
    });

    it('should call deleteGoal when confirmed', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ id: '42' });
      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = await screen.findByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteGoal).toHaveBeenCalledWith(42);
      });
    });

    it('should handle invalid goal ID in delete gracefully', async () => {
      const user = userEvent.setup();
      const goal = createMockGoal({ id: 'not-a-number' });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GoalDetailHeader goal={goal} />);

      const menuButton = screen.getByRole('button', { name: /actions menu/i });
      await user.click(menuButton);

      const deleteButton = screen.getByRole('menuitem', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = await screen.findByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Invalid goal ID:', 'not-a-number');
        expect(mockDeleteGoal).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
