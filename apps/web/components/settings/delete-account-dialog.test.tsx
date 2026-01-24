import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAccountDialog } from './delete-account-dialog';
import * as useSettingsMutationsHook from '@/lib/settings/use-settings-mutations';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/settings',
}));

vi.mock('@/lib/settings/use-settings-mutations');

describe('DeleteAccountDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockDeleteAccount = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSettingsMutationsHook.useDeleteAccount).mockReturnValue({
      deleteAccount: mockDeleteAccount,
      loading: false,
      error: undefined,
    });
  });

  it('should render dialog when open', () => {
    render(<DeleteAccountDialog {...defaultProps} />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<DeleteAccountDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });

  it('should display title', () => {
    render(<DeleteAccountDialog {...defaultProps} />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent('title');
  });

  it('should display description', () => {
    render(<DeleteAccountDialog {...defaultProps} />);

    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should display warning text', () => {
    render(<DeleteAccountDialog {...defaultProps} />);

    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('should render cancel button', () => {
    render(<DeleteAccountDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
  });

  it('should render confirm button with destructive styling', () => {
    render(<DeleteAccountDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    expect(confirmButton).toHaveClass('bg-destructive');
  });

  it('should call deleteAccount on confirm click', async () => {
    const user = userEvent.setup();
    mockDeleteAccount.mockResolvedValue(true);

    render(<DeleteAccountDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalled();
    });
  });

  it('should disable buttons during mutation', () => {
    vi.mocked(useSettingsMutationsHook.useDeleteAccount).mockReturnValue({
      deleteAccount: mockDeleteAccount,
      loading: true,
      error: undefined,
    });

    render(<DeleteAccountDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    const cancelButton = screen.getByRole('button', { name: 'cancel' });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should render dialog with appropriate role', () => {
    render(<DeleteAccountDialog {...defaultProps} />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('should close dialog when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<DeleteAccountDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'cancel' });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
