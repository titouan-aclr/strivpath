import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarNavContent } from './sidebar-nav-content';
import { SPORT_CONFIGS } from '@/lib/sports/config';
import { SportType } from '@/gql/graphql';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/sports/hooks');

import * as navigation from 'next/navigation';
import * as sportsHooks from '@/lib/sports/hooks';

const mockRunConfig = SPORT_CONFIGS[SportType.Run];
const mockRideConfig = SPORT_CONFIGS[SportType.Ride];

describe('SidebarNavContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigation.usePathname).mockReturnValue('/en/dashboard');
    vi.mocked(sportsHooks.useAvailableSports).mockReturnValue({
      sportConfigs: [],
      availableSports: [],
      loading: false,
    });
  });

  it('should render a nav landmark', () => {
    render(<SidebarNavContent />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should render all four main nav items', () => {
    render(<SidebarNavContent />);

    expect(screen.getByRole('link', { name: /navigation\.dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /navigation\.activities/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /navigation\.goals/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /navigation\.badges/i })).toBeInTheDocument();
  });

  it('should render the Settings nav item', () => {
    render(<SidebarNavContent />);

    expect(screen.getByRole('link', { name: /navigation\.settings/i })).toBeInTheDocument();
  });

  it('should not render the sports section when sportConfigs is empty', () => {
    render(<SidebarNavContent />);

    expect(screen.queryByText('navigation.sports.title')).not.toBeInTheDocument();
  });

  it('should render sports section title and sport links when sports are available', () => {
    vi.mocked(sportsHooks.useAvailableSports).mockReturnValue({
      sportConfigs: [mockRunConfig, mockRideConfig],
      availableSports: [SportType.Run, SportType.Ride],
      loading: false,
    });
    render(<SidebarNavContent />);

    expect(screen.getByText('navigation.sports.title')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /navigation\.sports\.running/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /navigation\.sports\.cycling/i })).toBeInTheDocument();
  });

  it('should show loading skeletons when sportsLoading is true', () => {
    vi.mocked(sportsHooks.useAvailableSports).mockReturnValue({
      sportConfigs: [],
      availableSports: [],
      loading: true,
    });
    render(<SidebarNavContent />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render the sports section title when sportsLoading is true', () => {
    vi.mocked(sportsHooks.useAvailableSports).mockReturnValue({
      sportConfigs: [],
      availableSports: [],
      loading: true,
    });
    render(<SidebarNavContent />);

    expect(screen.queryByText('navigation.sports.title')).not.toBeInTheDocument();
  });

  it('should apply bg-primary/10 class to the active main nav link', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/dashboard');
    render(<SidebarNavContent />);

    const dashboardLink = screen.getByRole('link', { name: /navigation\.dashboard/i });
    expect(dashboardLink).toHaveClass('bg-primary/10');
  });

  it('should not apply bg-primary/10 class to non-active main nav links', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/dashboard');
    render(<SidebarNavContent />);

    const activitiesLink = screen.getByRole('link', { name: /navigation\.activities/i });
    expect(activitiesLink).not.toHaveClass('bg-primary/10');
  });

  it('should apply bg-primary/10 class to the Settings link when on /settings path', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/settings');
    render(<SidebarNavContent />);

    const settingsLink = screen.getByRole('link', { name: /navigation\.settings/i });
    expect(settingsLink).toHaveClass('bg-primary/10');
  });

  it('should apply bg-primary/10 class to an active sport link', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/sports/running');
    vi.mocked(sportsHooks.useAvailableSports).mockReturnValue({
      sportConfigs: [mockRunConfig, mockRideConfig],
      availableSports: [SportType.Run, SportType.Ride],
      loading: false,
    });
    render(<SidebarNavContent />);

    const runningLink = screen.getByRole('link', { name: /navigation\.sports\.running/i });
    expect(runningLink).toHaveClass('bg-primary/10');
  });

  it('should not apply bg-primary/10 class to an inactive sport link', () => {
    vi.mocked(navigation.usePathname).mockReturnValue('/en/sports/running');
    vi.mocked(sportsHooks.useAvailableSports).mockReturnValue({
      sportConfigs: [mockRunConfig, mockRideConfig],
      availableSports: [SportType.Run, SportType.Ride],
      loading: false,
    });
    render(<SidebarNavContent />);

    const cyclingLink = screen.getByRole('link', { name: /navigation\.sports\.cycling/i });
    expect(cyclingLink).not.toHaveClass('bg-primary/10');
  });

  it('should call onNavigate when clicking a main nav link', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<SidebarNavContent onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: /navigation\.activities/i }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('should call onNavigate when clicking the Settings link', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<SidebarNavContent onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: /navigation\.settings/i }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('should call onNavigate when clicking a sport link', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    vi.mocked(sportsHooks.useAvailableSports).mockReturnValue({
      sportConfigs: [mockRunConfig],
      availableSports: [SportType.Run],
      loading: false,
    });
    render(<SidebarNavContent onNavigate={onNavigate} />);

    await user.click(screen.getByRole('link', { name: /navigation\.sports\.running/i }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it('should not throw when onNavigate is not provided', async () => {
    const user = userEvent.setup();
    render(<SidebarNavContent />);

    await expect(user.click(screen.getByRole('link', { name: /navigation\.dashboard/i }))).resolves.toBeUndefined();
  });
});
