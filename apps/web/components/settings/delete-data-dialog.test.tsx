import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteDataDialog } from './delete-data-dialog';
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

describe('DeleteDataDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockDeleteUserData = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSettingsMutationsHook.useDeleteUserData).mockReturnValue({
      deleteUserData: mockDeleteUserData,
      loading: false,
      error: undefined,
    });
  });

  it('should render dialog when open', () => {
    render(<DeleteDataDialog {...defaultProps} />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<DeleteDataDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('title')).not.toBeInTheDocument();
  });

  it('should display title', () => {
    render(<DeleteDataDialog {...defaultProps} />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent('title');
  });

  it('should display description', () => {
    render(<DeleteDataDialog {...defaultProps} />);

    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should display warning text', () => {
    render(<DeleteDataDialog {...defaultProps} />);

    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('should render cancel button', () => {
    render(<DeleteDataDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
  });

  it('should render confirm button with destructive styling', () => {
    render(<DeleteDataDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    expect(confirmButton).toHaveClass('bg-destructive');
  });

  it('should call deleteUserData on confirm click', async () => {
    const user = userEvent.setup();
    mockDeleteUserData.mockResolvedValue(true);

    render(<DeleteDataDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteUserData).toHaveBeenCalled();
    });
  });

  it('should close dialog on successful deletion', async () => {
    const user = userEvent.setup();
    mockDeleteUserData.mockResolvedValue(true);

    render(<DeleteDataDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should call onSuccess callback on success', async () => {
    const user = userEvent.setup();
    mockDeleteUserData.mockResolvedValue(true);

    render(<DeleteDataDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should disable buttons during mutation', () => {
    vi.mocked(useSettingsMutationsHook.useDeleteUserData).mockReturnValue({
      deleteUserData: mockDeleteUserData,
      loading: true,
      error: undefined,
    });

    render(<DeleteDataDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    const cancelButton = screen.getByRole('button', { name: 'cancel' });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should not call onSuccess when deletion fails', async () => {
    const user = userEvent.setup();
    mockDeleteUserData.mockResolvedValue(false);

    render(<DeleteDataDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteUserData).toHaveBeenCalled();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should work without onSuccess callback', async () => {
    const user = userEvent.setup();
    mockDeleteUserData.mockResolvedValue(true);

    render(<DeleteDataDialog {...defaultProps} onSuccess={undefined} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
