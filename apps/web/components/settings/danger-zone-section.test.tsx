import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DangerZoneSection } from './danger-zone-section';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('./delete-data-dialog', () => ({
  DeleteDataDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-data-dialog">DeleteDataDialog</div> : null,
}));

vi.mock('./delete-account-dialog', () => ({
  DeleteAccountDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-account-dialog">DeleteAccountDialog</div> : null,
}));

describe('DangerZoneSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title in destructive color', () => {
    render(<DangerZoneSection />);

    const title = screen.getByText('title');
    expect(title).toHaveClass('text-destructive');
  });

  it('should render warning description', () => {
    render(<DangerZoneSection />);

    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('should have destructive border styling', () => {
    const { container } = render(<DangerZoneSection />);

    const card = container.querySelector('.border-destructive\\/50');
    expect(card).toBeInTheDocument();
  });

  it('should render delete data section with title', () => {
    render(<DangerZoneSection />);

    expect(screen.getByText('deleteData.title')).toBeInTheDocument();
  });

  it('should render delete data section with description', () => {
    render(<DangerZoneSection />);

    expect(screen.getByText('deleteData.description')).toBeInTheDocument();
  });

  it('should render delete data button', () => {
    render(<DangerZoneSection />);

    expect(screen.getByRole('button', { name: /deleteData.button/i })).toBeInTheDocument();
  });

  it('should render delete data button with outline destructive styling', () => {
    render(<DangerZoneSection />);

    const button = screen.getByRole('button', { name: /deleteData.button/i });
    expect(button).toHaveClass('text-destructive');
    expect(button).toHaveClass('border-destructive/50');
  });

  it('should render delete account section with title', () => {
    render(<DangerZoneSection />);

    expect(screen.getByText('deleteAccount.title')).toBeInTheDocument();
  });

  it('should render delete account section with description', () => {
    render(<DangerZoneSection />);

    expect(screen.getByText('deleteAccount.description')).toBeInTheDocument();
  });

  it('should render delete account button with destructive variant', () => {
    render(<DangerZoneSection />);

    const button = screen.getByRole('button', { name: /deleteAccount.button/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('should open delete data dialog when delete data button clicked', async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);

    const deleteDataButton = screen.getByRole('button', { name: /deleteData.button/i });
    await user.click(deleteDataButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-data-dialog')).toBeInTheDocument();
    });
  });

  it('should open delete account dialog when delete account button clicked', async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);

    const deleteAccountButton = screen.getByRole('button', { name: /deleteAccount.button/i });
    await user.click(deleteAccountButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-dialog')).toBeInTheDocument();
    });
  });

  it('should not render delete data dialog by default', () => {
    render(<DangerZoneSection />);

    expect(screen.queryByTestId('delete-data-dialog')).not.toBeInTheDocument();
  });

  it('should not render delete account dialog by default', () => {
    render(<DangerZoneSection />);

    expect(screen.queryByTestId('delete-account-dialog')).not.toBeInTheDocument();
  });

  it('should render warning icon', () => {
    const { container } = render(<DangerZoneSection />);

    const warningIcon = container.querySelector('svg');
    expect(warningIcon).toBeInTheDocument();
  });

  it('should render trash icons in buttons', () => {
    const { container } = render(<DangerZoneSection />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(1);
  });

  it('should render sections with destructive background', () => {
    const { container } = render(<DangerZoneSection />);

    const destructiveSections = container.querySelectorAll('.bg-destructive\\/5');
    expect(destructiveSections.length).toBe(2);
  });
});
