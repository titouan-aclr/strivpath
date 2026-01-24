import { SportType, UserPreferencesInfoFragment } from '@/gql/graphql';
import * as useUserPreferencesHook from '@/lib/settings/use-user-preferences';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SportsSection } from './sports-section';

const createMockPreferences = (selectedSports: SportType[]): UserPreferencesInfoFragment => ({
  id: 1,
  selectedSports,
  onboardingCompleted: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

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

vi.mock('@/lib/settings/use-user-preferences');

vi.mock('./sport-removal-dialog', () => ({
  SportRemovalDialog: ({ open, sport, sportLabel }: { open: boolean; sport: SportType | null; sportLabel: string }) =>
    open ? (
      <div data-testid="sport-removal-dialog" data-sport={sport} data-sport-label={sportLabel}>
        SportRemovalDialog
      </div>
    ) : null,
}));

vi.mock('./add-sport-dialog', () => ({
  AddSportDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-sport-dialog">AddSportDialog</div> : null,
}));

describe('SportsSection', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title and description', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run, SportType.Ride]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should render loading skeleton when loading', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: null,
      loading: true,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useUserPreferencesHook.useUserPreferences>);

    const { container } = render(<SportsSection />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render all selected sports as badges', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run, SportType.Ride]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    expect(screen.getByText('run.title')).toBeInTheDocument();
    expect(screen.getByText('ride.title')).toBeInTheDocument();
  });

  it('should show remove button for each sport when multiple sports', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run, SportType.Ride]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  it('should not show remove button when only one sport', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    const removeButtons = screen.queryAllByRole('button', { name: /Remove/i });
    expect(removeButtons).toHaveLength(0);
  });

  it('should show toast error when trying to remove last sport via direct call', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('should show add sport button when not all sports selected', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('should hide add sport button when all sports selected', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run, SportType.Ride, SportType.Swim]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });

  it('should open add sport dialog on add button click', async () => {
    const user = userEvent.setup();
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-sport-dialog')).toBeInTheDocument();
    });
  });

  it('should open sport removal dialog on remove click', async () => {
    const user = userEvent.setup();
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run, SportType.Ride]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('sport-removal-dialog')).toBeInTheDocument();
    });
  });

  it('should render sport icons with strava-orange color', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Run]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    const { container } = render(<SportsSection />);

    const sportIcon = container.querySelector('.text-strava-orange');
    expect(sportIcon).toBeInTheDocument();
  });

  it('should render swim sport correctly', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([SportType.Swim]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    expect(screen.getByText('swim.title')).toBeInTheDocument();
  });

  it('should handle empty selectedSports array', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: createMockPreferences([]),
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    render(<SportsSection />);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('should handle null preferences', () => {
    vi.mocked(useUserPreferencesHook.useUserPreferences).mockReturnValue({
      preferences: null,
      loading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useUserPreferencesHook.useUserPreferences>);

    render(<SportsSection />);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });
});
