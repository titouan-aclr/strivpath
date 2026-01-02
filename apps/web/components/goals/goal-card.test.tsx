import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalCard } from './goal-card';
import { GoalStatus, GoalTargetType, GoalPeriodType, SportType } from '@/gql/graphql';

const mockUseTranslations =
  (namespace?: string) => (key: string, values?: Record<string, string | number | undefined>) => {
    if (key === 'progress.label') {
      return `${values?.current} of ${values?.target} ${values?.unit}`;
    }
    if (key === 'daysRemaining.days') {
      return `${values?.count} days left`;
    }
    if (key === 'description') {
      return `Are you sure you want to delete "${values?.title}"?`;
    }

    const fullKey = namespace ? `${namespace}.${key}` : key;

    const translations: Record<string, string> = {
      'goals.actions.menu': 'Goal actions',
      'goals.actions.edit': 'Edit',
      'goals.actions.archive': 'Archive',
      'goals.actions.delete': 'Delete',
      'goals.deleteDialog.title': 'Delete Goal',
      'goals.deleteDialog.cancel': 'Cancel',
      'goals.deleteDialog.confirm': 'Delete',
      'goals.daysRemaining.expired': 'Expired',
      'goals.daysRemaining.today': 'Today',
      'goals.daysRemaining.tomorrow': 'Tomorrow',
      'goals.status.active': 'In Progress',
      'goals.status.completed': 'Completed',
      'goals.status.failed': 'Failed',
      'goals.status.archived': 'Archived',
    };

    return translations[fullKey] || key;
  };

const mockUseLocale = () => 'en';

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
  useLocale: () => mockUseLocale(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="goal-card-link">
      {children}
    </a>
  ),
}));

const mockGoal = {
  __typename: 'Goal' as const,
  id: '1',
  title: 'Courir 50km ce mois',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  targetType: GoalTargetType.Distance,
  targetValue: 50,
  currentValue: 35.5,
  progressPercentage: 71,
  status: GoalStatus.Active,
  periodType: GoalPeriodType.Monthly,
  sportType: SportType.Run,
  description: null,
  isRecurring: false,
  isExpired: false,
  daysRemaining: 15,
  createdAt: new Date('2026-01-01'),
};

describe('GoalCard', () => {
  const mockOnArchive = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders goal information correctly', () => {
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    expect(screen.getByText('Courir 50km ce mois')).toBeInTheDocument();
    expect(screen.getByText(/35\.5.*\/.*50\.0/i)).toBeInTheDocument();
    expect(screen.getByText('71.0%')).toBeInTheDocument();
  });

  it('displays correct sport icon for running', () => {
    const { container } = render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    const sportIconContainer = container.querySelector('.bg-strava-orange\\/10');
    expect(sportIconContainer).toBeInTheDocument();
  });

  it('navigates to detail page when card link wrapper is clicked', () => {
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    const link = screen.getByTestId('goal-card-link');
    expect(link).toHaveAttribute('href', '/goals/1');
  });

  it('CRITICAL: prevents navigation when dropdown button is clicked (event propagation)', () => {
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button', { name: /goal actions/i });
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    menuButton.dispatchEvent(clickEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('opens delete dialog when delete action is clicked', async () => {
    const user = userEvent.setup();
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button', { name: /goal actions/i });
    await user.click(menuButton);

    const deleteButton = await screen.findByText('Delete');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Goal')).toBeInTheDocument();
    });
  });

  it('calls onDelete when delete is confirmed in dialog', async () => {
    const user = userEvent.setup();
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button', { name: /goal actions/i });
    await user.click(menuButton);

    const deleteButton = await screen.findByText('Delete');
    await user.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('calls onArchive when archive action is clicked without opening dialog', async () => {
    const user = userEvent.setup();
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    const menuButton = screen.getByRole('button', { name: /goal actions/i });
    await user.click(menuButton);

    const archiveButton = await screen.findByText('Archive');
    await user.click(archiveButton);

    await waitFor(() => {
      expect(mockOnArchive).toHaveBeenCalledWith('1');
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('disables dropdown menu when disabled prop is true', () => {
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} disabled />);

    const menuButton = screen.getByRole('button', { name: /goal actions/i });
    expect(menuButton).toBeDisabled();
  });

  it('displays correct status badge', () => {
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('displays days remaining correctly', () => {
    render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    expect(screen.getByText(/29 days left/i)).toBeInTheDocument();
  });

  it('displays hover effect classes on card', () => {
    const { container } = render(<GoalCard goal={mockGoal} onArchive={mockOnArchive} onDelete={mockOnDelete} />);

    const card = container.querySelector('.hover\\:shadow-lg');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('hover:border-strava-orange/50', 'cursor-pointer');
  });
});
