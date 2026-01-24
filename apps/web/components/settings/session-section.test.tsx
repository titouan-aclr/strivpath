import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionSection } from './session-section';
import * as useLogoutHook from '@/lib/auth/use-logout';

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

vi.mock('@/lib/auth/use-logout');

describe('SessionSection', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: mockLogout,
      isLoading: false,
      error: null,
    });
  });

  it('should render section title', () => {
    render(<SessionSection />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('should render section description', () => {
    render(<SessionSection />);

    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    render(<SessionSection />);

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should call logout when button clicked', async () => {
    const user = userEvent.setup();
    render(<SessionSection />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show loading spinner when logging out', () => {
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: mockLogout,
      isLoading: true,
      error: null,
    });

    const { container } = render(<SessionSection />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show "Logging out" text when loading', () => {
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: mockLogout,
      isLoading: true,
      error: null,
    });

    render(<SessionSection />);

    expect(screen.getByText('loggingOut')).toBeInTheDocument();
  });

  it('should disable button while logging out', () => {
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: mockLogout,
      isLoading: true,
      error: null,
    });

    render(<SessionSection />);

    const logoutButton = screen.getByRole('button', { name: /loggingOut/i });
    expect(logoutButton).toBeDisabled();
  });

  it('should have aria-busy attribute when loading', () => {
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: mockLogout,
      isLoading: true,
      error: null,
    });

    render(<SessionSection />);

    const logoutButton = screen.getByRole('button', { name: /loggingOut/i });
    expect(logoutButton).toHaveAttribute('aria-busy', 'true');
  });

  it('should not have aria-busy attribute when not loading', () => {
    render(<SessionSection />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toHaveAttribute('aria-busy', 'false');
  });

  it('should render outline variant button', () => {
    render(<SessionSection />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toHaveClass('border');
  });

  it('should render logout icon when not loading', () => {
    const { container } = render(<SessionSection />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
