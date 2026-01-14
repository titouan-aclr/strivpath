import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalDeleteDialog } from './goal-delete-dialog';

const mockUseTranslations = (namespace?: string) => (key: string, params?: Record<string, unknown>) => {
  const translations: Record<string, string> = {
    'goals.deleteDialog.title': 'Delete Goal',
    'goals.deleteDialog.description': 'Are you sure you want to delete "{title}"? This action cannot be undone.',
    'goals.deleteDialog.cancel': 'Cancel',
    'goals.deleteDialog.confirm': 'Delete',
  };
  const fullKey = namespace ? `${namespace}.${key}` : key;
  const translation = translations[fullKey] || key;

  if (params?.title && typeof params.title === 'string') {
    return translation.replace('{title}', params.title);
  }
  return translation;
};

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => mockUseTranslations(namespace),
}));

describe('GoalDeleteDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    goalTitle: 'Run 50km this month',
    onConfirm: mockOnConfirm,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open is true', () => {
    render(<GoalDeleteDialog {...defaultProps} />);

    expect(screen.getByText('Delete Goal')).toBeInTheDocument();
  });

  it('should not render dialog when open is false', () => {
    render(<GoalDeleteDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Delete Goal')).not.toBeInTheDocument();
  });

  it('should display goal title in description', () => {
    render(<GoalDeleteDialog {...defaultProps} />);

    expect(
      screen.getByText('Are you sure you want to delete "Run 50km this month"? This action cannot be undone.'),
    ).toBeInTheDocument();
  });

  it('should render cancel button', () => {
    render(<GoalDeleteDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should render confirm button', () => {
    render(<GoalDeleteDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<GoalDeleteDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should render dialog content when open', () => {
    render(<GoalDeleteDialog {...defaultProps} />);

    expect(screen.getByText('Delete Goal')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
  });

  it('should have destructive styling on confirm button', () => {
    render(<GoalDeleteDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: /delete/i });
    expect(confirmButton).toHaveClass('bg-destructive');
    expect(confirmButton).toHaveClass('text-destructive-foreground');
  });

  it('should handle escape key to close dialog', async () => {
    const user = userEvent.setup();
    render(<GoalDeleteDialog {...defaultProps} />);

    await user.keyboard('{Escape}');

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should close dialog when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<GoalDeleteDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
