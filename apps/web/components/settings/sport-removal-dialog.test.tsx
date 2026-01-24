import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SportRemovalDialog } from './sport-removal-dialog';
import { SportType } from '@/gql/graphql';
import * as useSportDataCountHook from '@/lib/settings/use-sport-data-count';
import * as useSettingsMutationsHook from '@/lib/settings/use-settings-mutations';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values) {
      return `${key}:${JSON.stringify(values)}`;
    }
    return key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/settings',
}));

vi.mock('@/lib/settings/use-sport-data-count');
vi.mock('@/lib/settings/use-settings-mutations');

describe('SportRemovalDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockRemoveSport = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    sport: SportType.Run,
    sportLabel: 'Running',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSportDataCountHook.useSportDataCount).mockReturnValue({
      data: { activitiesCount: 42, goalsCount: 3 },
      loading: false,
    } as ReturnType<typeof useSportDataCountHook.useSportDataCount>);

    vi.mocked(useSettingsMutationsHook.useRemoveSport).mockReturnValue({
      removeSport: mockRemoveSport,
      loading: false,
      error: undefined,
    });
  });

  it('should render dialog when open', () => {
    render(<SportRemovalDialog {...defaultProps} />);

    expect(screen.getByText('title:{"sport":"Running"}')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<SportRemovalDialog {...defaultProps} open={false} />);

    expect(screen.queryByText(/title/)).not.toBeInTheDocument();
  });

  it('should display sport label in title', () => {
    render(<SportRemovalDialog {...defaultProps} sportLabel="Cycling" />);

    expect(screen.getByText('title:{"sport":"Cycling"}')).toBeInTheDocument();
  });

  it('should disable confirm button while loading data count', () => {
    vi.mocked(useSportDataCountHook.useSportDataCount).mockReturnValue({
      data: null,
      loading: true,
    } as unknown as ReturnType<typeof useSportDataCountHook.useSportDataCount>);

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    expect(confirmButton).toBeDisabled();
  });

  it('should display data count description when has data', () => {
    render(<SportRemovalDialog {...defaultProps} />);

    expect(screen.getByText('description:{"activitiesCount":42,"goalsCount":3}')).toBeInTheDocument();
  });

  it('should display "no data" message when no data', () => {
    vi.mocked(useSportDataCountHook.useSportDataCount).mockReturnValue({
      data: { activitiesCount: 0, goalsCount: 0 },
      loading: false,
    } as ReturnType<typeof useSportDataCountHook.useSportDataCount>);

    render(<SportRemovalDialog {...defaultProps} />);

    expect(screen.getByText('noData')).toBeInTheDocument();
  });

  it('should render radio group for keep/delete data when has data', () => {
    render(<SportRemovalDialog {...defaultProps} />);

    expect(screen.getByLabelText(/keepData/)).toBeInTheDocument();
    expect(screen.getByLabelText(/deleteData/)).toBeInTheDocument();
  });

  it('should not render radio group when no data', () => {
    vi.mocked(useSportDataCountHook.useSportDataCount).mockReturnValue({
      data: { activitiesCount: 0, goalsCount: 0 },
      loading: false,
    } as ReturnType<typeof useSportDataCountHook.useSportDataCount>);

    render(<SportRemovalDialog {...defaultProps} />);

    expect(screen.queryByLabelText(/keepData/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/deleteData/)).not.toBeInTheDocument();
  });

  it('should default to "keep data" option', () => {
    render(<SportRemovalDialog {...defaultProps} />);

    const keepDataRadio = screen.getByRole('radio', { name: /keepData/ });
    expect(keepDataRadio).toBeChecked();
  });

  it('should allow switching to "delete data" option', async () => {
    const user = userEvent.setup();
    render(<SportRemovalDialog {...defaultProps} />);

    const deleteDataRadio = screen.getByRole('radio', { name: /deleteData/ });
    await user.click(deleteDataRadio);

    expect(deleteDataRadio).toBeChecked();
  });

  it('should call removeSport with deleteData=false by default', async () => {
    const user = userEvent.setup();
    mockRemoveSport.mockResolvedValue(true);

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockRemoveSport).toHaveBeenCalledWith(SportType.Run, false);
    });
  });

  it('should call removeSport with deleteData=true when selected', async () => {
    const user = userEvent.setup();
    mockRemoveSport.mockResolvedValue(true);

    render(<SportRemovalDialog {...defaultProps} />);

    const deleteDataRadio = screen.getByRole('radio', { name: /deleteData/ });
    await user.click(deleteDataRadio);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockRemoveSport).toHaveBeenCalledWith(SportType.Run, true);
    });
  });

  it('should close dialog and reset on success', async () => {
    const user = userEvent.setup();
    mockRemoveSport.mockResolvedValue(true);

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should disable buttons during mutation', () => {
    vi.mocked(useSettingsMutationsHook.useRemoveSport).mockReturnValue({
      removeSport: mockRemoveSport,
      loading: true,
      error: undefined,
    });

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    const cancelButton = screen.getByRole('button', { name: 'cancel' });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should disable confirm button while loading count', () => {
    vi.mocked(useSportDataCountHook.useSportDataCount).mockReturnValue({
      data: null,
      loading: true,
    } as unknown as ReturnType<typeof useSportDataCountHook.useSportDataCount>);

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    expect(confirmButton).toBeDisabled();
  });

  it('should not close dialog while removing', () => {
    vi.mocked(useSettingsMutationsHook.useRemoveSport).mockReturnValue({
      removeSport: mockRemoveSport,
      loading: true,
      error: undefined,
    });

    render(<SportRemovalDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: 'cancel' });
    expect(cancelButton).toBeDisabled();
  });

  it('should call onSuccess callback after successful removal', async () => {
    const user = userEvent.setup();
    mockRemoveSport.mockResolvedValue(true);

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should not call onSuccess when removal fails', async () => {
    const user = userEvent.setup();
    mockRemoveSport.mockResolvedValue(false);

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockRemoveSport).toHaveBeenCalled();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should not close dialog when removal fails', async () => {
    const user = userEvent.setup();
    mockRemoveSport.mockResolvedValue(false);

    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockRemoveSport).toHaveBeenCalled();
    });

    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('should reset deleteData state when closed', async () => {
    const user = userEvent.setup();
    render(<SportRemovalDialog {...defaultProps} />);

    const deleteDataRadio = screen.getByRole('radio', { name: /deleteData/ });
    await user.click(deleteDataRadio);
    expect(deleteDataRadio).toBeChecked();

    const cancelButton = screen.getByRole('button', { name: 'cancel' });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not fetch sport data count when dialog is closed', () => {
    render(<SportRemovalDialog {...defaultProps} open={false} />);

    expect(useSportDataCountHook.useSportDataCount).toHaveBeenCalledWith(null);
  });

  it('should fetch sport data count when dialog is open', () => {
    render(<SportRemovalDialog {...defaultProps} />);

    expect(useSportDataCountHook.useSportDataCount).toHaveBeenCalledWith(SportType.Run);
  });

  it('should not call removeSport when sport is null', async () => {
    const user = userEvent.setup();
    render(<SportRemovalDialog {...defaultProps} sport={null} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    await user.click(confirmButton);

    expect(mockRemoveSport).not.toHaveBeenCalled();
  });

  it('should render destructive styling on confirm button', () => {
    render(<SportRemovalDialog {...defaultProps} />);

    const confirmButton = screen.getByRole('button', { name: 'confirm' });
    expect(confirmButton).toHaveClass('bg-destructive');
  });
});
