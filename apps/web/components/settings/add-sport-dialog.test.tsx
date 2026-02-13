import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddSportDialog } from './add-sport-dialog';
import { SportType } from '@/gql/graphql';
import * as useSettingsMutationsHook from '@/lib/settings/use-settings-mutations';
import * as useSyncContext from '@/lib/sync/context';

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
vi.mock('@/lib/sync/context');

describe('AddSportDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockAddSport = vi.fn();
  const mockTriggerSync = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    selectedSports: [SportType.Run] as SportType[],
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSettingsMutationsHook.useAddSport).mockReturnValue({
      addSport: mockAddSport,
      loading: false,
      error: undefined,
    });

    vi.mocked(useSyncContext.useSync).mockReturnValue({
      triggerSync: mockTriggerSync,
      syncHistory: null,
      isPolling: false,
      isSyncing: false,
      isLoading: false,
      error: null,
      triggerSource: null,
      retry: vi.fn(),
      refreshStatus: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('should render dialog when open', () => {
    render(<AddSportDialog {...defaultProps} />);

    expect(screen.getByText('addDialog.title')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<AddSportDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('addDialog.title')).not.toBeInTheDocument();
  });

  it('should display available sports only', () => {
    render(<AddSportDialog {...defaultProps} selectedSports={[SportType.Run]} />);

    expect(screen.getByText('ride.title')).toBeInTheDocument();
    expect(screen.getByText('swim.title')).toBeInTheDocument();
    expect(screen.queryByText('run.title')).not.toBeInTheDocument();
  });

  it('should filter out already selected sports', () => {
    render(<AddSportDialog {...defaultProps} selectedSports={[SportType.Run, SportType.Ride]} />);

    expect(screen.getByText('swim.title')).toBeInTheDocument();
    expect(screen.queryByText('run.title')).not.toBeInTheDocument();
    expect(screen.queryByText('ride.title')).not.toBeInTheDocument();
  });

  it('should show no sports message when all selected', () => {
    render(<AddSportDialog {...defaultProps} selectedSports={[SportType.Run, SportType.Ride, SportType.Swim]} />);

    expect(screen.getByText('addDialog.noSportsAvailable')).toBeInTheDocument();
  });

  it('should allow sport selection', async () => {
    const user = userEvent.setup();
    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    expect(rideCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('should highlight selected sport with ring', async () => {
    const user = userEvent.setup();
    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    expect(rideCard).toHaveClass('selected-ring');
  });

  it('should handle keyboard navigation with Enter', async () => {
    const user = userEvent.setup();
    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]') as HTMLElement;
    rideCard.focus();
    await user.keyboard('{Enter}');

    expect(rideCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('should handle keyboard navigation with Space', async () => {
    const user = userEvent.setup();
    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]') as HTMLElement;
    rideCard.focus();
    await user.keyboard(' ');

    expect(rideCard).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call addSport mutation on confirm', async () => {
    const user = userEvent.setup();
    mockAddSport.mockResolvedValue({ selectedSports: [SportType.Run, SportType.Ride] });

    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAddSport).toHaveBeenCalledWith(SportType.Ride);
    });
  });

  it('should trigger sync after adding sport', async () => {
    const user = userEvent.setup();
    mockAddSport.mockResolvedValue({ selectedSports: [SportType.Run, SportType.Ride] });

    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockTriggerSync).toHaveBeenCalledWith('add_sport');
    });
  });

  it('should close dialog on success', async () => {
    const user = userEvent.setup();
    mockAddSport.mockResolvedValue({ selectedSports: [SportType.Run, SportType.Ride] });

    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should call onSuccess callback', async () => {
    const user = userEvent.setup();
    mockAddSport.mockResolvedValue({ selectedSports: [SportType.Run, SportType.Ride] });

    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should disable buttons during loading', () => {
    vi.mocked(useSettingsMutationsHook.useAddSport).mockReturnValue({
      addSport: mockAddSport,
      loading: true,
      error: undefined,
    });

    render(<AddSportDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    const cancelButton = screen.getByRole('button', { name: 'addDialog.cancel' });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should reset selection on close', async () => {
    const user = userEvent.setup();
    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);
    expect(rideCard).toHaveAttribute('aria-pressed', 'true');

    const cancelButton = screen.getByRole('button', { name: 'addDialog.cancel' });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should disable confirm button when no sport selected', () => {
    render(<AddSportDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    expect(confirmButton).toBeDisabled();
  });

  it('should disable confirm button when no sports available', () => {
    render(<AddSportDialog {...defaultProps} selectedSports={[SportType.Run, SportType.Ride, SportType.Swim]} />);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    expect(confirmButton).toBeDisabled();
  });

  it('should not close dialog when addSport returns null', async () => {
    const user = userEvent.setup();
    mockAddSport.mockResolvedValue(null);

    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAddSport).toHaveBeenCalled();
    });

    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('should not call triggerSync when addSport fails', async () => {
    const user = userEvent.setup();
    mockAddSport.mockResolvedValue(null);

    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAddSport).toHaveBeenCalled();
    });

    expect(mockTriggerSync).not.toHaveBeenCalled();
  });

  it('should not call onSuccess when addSport fails', async () => {
    const user = userEvent.setup();
    mockAddSport.mockResolvedValue(null);

    render(<AddSportDialog {...defaultProps} />);

    const rideCard = screen.getByText('ride.title').closest('[role="button"]');
    await user.click(rideCard!);

    const confirmButton = screen.getByRole('button', { name: 'addDialog.confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAddSport).toHaveBeenCalled();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
