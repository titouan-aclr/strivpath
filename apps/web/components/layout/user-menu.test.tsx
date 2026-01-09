import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from './user-menu';
import * as authContext from '@/lib/auth/context';
import * as authFeedback from '@/lib/auth/use-auth-feedback';
import * as useLogoutHook from '@/lib/auth/use-logout';

vi.mock('@/lib/auth/context');
vi.mock('@/lib/auth/use-auth-feedback');
vi.mock('@/lib/auth/use-logout');
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUser = {
  id: '1',
  stravaId: 12345,
  username: 'johndoe',
  firstname: 'John',
  lastname: 'Doe',
  profile: 'https://example.com/avatar.jpg',
  profileMedium: null,
  city: 'Paris',
  country: 'France',
  sex: 'M' as const,
  premium: false,
  summit: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when user is null', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: null,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: vi.fn(),
      isLoading: false,
      error: null,
    });

    const { container } = render(<UserMenu />);

    expect(container.firstChild).toBeNull();
  });

  it('should render user menu with avatar and name', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<UserMenu />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display refresh badge when showRefreshing is true', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: true,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<UserMenu />);

    const refreshBadge = screen.getByRole('status', { name: 'refreshing' });
    expect(refreshBadge).toBeInTheDocument();
  });

  it('should not display refresh badge when showRefreshing is false', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<UserMenu />);

    const refreshBadge = screen.queryByRole('status', { name: 'refreshing' });
    expect(refreshBadge).not.toBeInTheDocument();
  });

  it('should display tooltip on refresh badge', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: true,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<UserMenu />);

    const badgeContainer = screen.getByRole('status', { name: 'refreshing' }).parentElement;
    expect(badgeContainer).toHaveAttribute('title', 'refreshing');
  });

  it('should display fallback initials with ? when firstname is missing', () => {
    const userWithoutFirstname = { ...mockUser, firstname: null };
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: userWithoutFirstname,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: vi.fn(),
      isLoading: false,
      error: null,
    });

    render(<UserMenu />);

    const avatarFallback = screen.getByText('?D');
    expect(avatarFallback).toBeInTheDocument();
  });

  it('should show loading state on logout button when isLoading', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: vi.fn(),
      isLoading: true,
      error: null,
    });

    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const logoutItem = screen.getByText('loggingOut').closest('div[role="menuitem"]');
    expect(logoutItem).toHaveAttribute('aria-busy', 'true');
    expect(logoutItem).toHaveAttribute('data-disabled');
  });

  it('should call logout handler when logout button clicked', async () => {
    const mockLogout = vi.fn();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });
    vi.mocked(authFeedback.useAuthFeedback).mockReturnValue({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
    vi.mocked(useLogoutHook.useLogout).mockReturnValue({
      logout: mockLogout,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<UserMenu />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const logoutButton = screen.getByText('logout').closest('div[role="menuitem"]');
    await user.click(logoutButton!);

    expect(mockLogout).toHaveBeenCalledOnce();
  });
});
