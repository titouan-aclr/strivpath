import * as authContext from '@/lib/auth/context';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileSection } from './profile-section';

vi.mock('@/lib/auth/context');

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

/* eslint-disable @next/next/no-img-element */
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    <img alt={alt} {...props} data-testid="next-image" />
  ),
}));

const createMockUser = (overrides = {}) => ({
  id: '1',
  stravaId: 12345,
  username: 'johndoe',
  firstname: 'John',
  lastname: 'Doe',
  profile: 'https://example.com/avatar.jpg',
  profileMedium: 'https://example.com/avatar-medium.jpg',
  city: 'Paris',
  country: 'France',
  sex: 'M' as const,
  premium: false,
  summit: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
  ...overrides,
});

describe('ProfileSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when user is null', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: null,
      setUser: vi.fn(),
    });

    const { container } = render(<ProfileSection />);

    expect(container.firstChild).toBeNull();
  });

  it('should render user avatar container', () => {
    const mockUser = createMockUser();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    const { container } = render(<ProfileSection />);

    const avatarContainer = container.querySelector('.rounded-full.h-16.w-16');
    expect(avatarContainer).toBeInTheDocument();
  });

  it('should render avatar fallback with initials', () => {
    const mockUser = createMockUser({ profile: null, profileMedium: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should render full name (firstname + lastname)', () => {
    const mockUser = createMockUser();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should fall back to username when no name', () => {
    const mockUser = createMockUser({ firstname: null, lastname: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('johndoe')).toBeInTheDocument();
  });

  it('should fall back to "Athlete" when no username and no name', () => {
    const mockUser = createMockUser({ firstname: null, lastname: null, username: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('Athlete')).toBeInTheDocument();
  });

  it('should render Strava profile link with username', () => {
    const mockUser = createMockUser();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    const stravaLink = screen.getByRole('link', { name: /@johndoe/i });
    expect(stravaLink).toHaveAttribute('href', 'https://www.strava.com/athletes/12345');
    expect(stravaLink).toHaveAttribute('target', '_blank');
    expect(stravaLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render "Connected via Strava" badge', () => {
    const mockUser = createMockUser();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('connectedVia')).toBeInTheDocument();
  });

  it('should render location when city is available', () => {
    const mockUser = createMockUser();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('Paris, France')).toBeInTheDocument();
  });

  it('should render city only when country is missing', () => {
    const mockUser = createMockUser({ country: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  it('should not render location when city is missing', () => {
    const mockUser = createMockUser({ city: null, country: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.queryByText('Paris')).not.toBeInTheDocument();
    expect(screen.queryByText('France')).not.toBeInTheDocument();
  });

  it('should render member since date when createdAt is available', () => {
    const mockUser = createMockUser();
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText(/memberSince/)).toBeInTheDocument();
  });

  it('should not render member since when createdAt is missing', () => {
    const mockUser = createMockUser({ createdAt: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.queryByText(/memberSince/)).not.toBeInTheDocument();
  });

  it('should render avatar fallback with ? when firstname is missing', () => {
    const mockUser = createMockUser({ firstname: null, profile: null, profileMedium: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('should render avatar fallback with ? when both names are missing', () => {
    const mockUser = createMockUser({ firstname: null, lastname: null, profile: null, profileMedium: null });
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
    });

    render(<ProfileSection />);

    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
