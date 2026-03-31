import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHeader } from './dashboard-header';
import * as useSyncContext from '@/lib/sync/context';
import type { DashboardUser, DashboardSyncHistory } from '@/lib/dashboard/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) => {
    const translations: Record<string, string> = {
      greeting: `Hello, ${String(values?.name ?? '')}`,
      greetingFallback: 'Hello',
      'sync.lastSync': `Last sync ${String(values?.time ?? '')}`,
      'sync.never': 'Never synced',
      'sync.syncNow': 'Sync now',
      'sync.syncing': 'Syncing...',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

vi.mock('@/lib/sync/context');

vi.mock('@/lib/dashboard/utils', async () => {
  const actual = await vi.importActual('@/lib/dashboard/utils');
  return {
    ...actual,
    formatTimeAgo: () => '5 minutes ago',
  };
});

describe('DashboardHeader', () => {
  const mockTriggerSync = vi.fn();

  const mockUser: DashboardUser = {
    id: '1',
    firstname: 'John',
    lastname: 'Doe',
  };

  const mockSyncHistory: DashboardSyncHistory = {
    id: '1',
    completedAt: new Date(),
    status: 'COMPLETED',
    stage: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: null,
      isLoading: false,
      isSyncing: false,
      isPolling: false,
      triggerSync: mockTriggerSync,
      error: null,
      triggerSource: null,
      retry: vi.fn(),
      refreshStatus: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('should render greeting with user name', () => {
    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    expect(screen.getByText('Hello, John')).toBeInTheDocument();
  });

  it('should render fallback greeting when no user', () => {
    render(<DashboardHeader user={null} syncHistory={mockSyncHistory} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should render fallback greeting when user has no firstname', () => {
    const userNoName: DashboardUser = { id: '1', firstname: null, lastname: null };
    render(<DashboardHeader user={userNoName} syncHistory={mockSyncHistory} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should display last sync time', () => {
    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    expect(screen.getByText('Last sync 5 minutes ago')).toBeInTheDocument();
  });

  it('should display never synced message when no sync history', () => {
    render(<DashboardHeader user={mockUser} syncHistory={null} />);

    expect(screen.getByText('Never synced')).toBeInTheDocument();
  });

  it('should display never synced when no completedAt', () => {
    const syncNoDate: DashboardSyncHistory = { ...mockSyncHistory, completedAt: null };
    render(<DashboardHeader user={mockUser} syncHistory={syncNoDate} />);

    expect(screen.getByText('Never synced')).toBeInTheDocument();
  });

  it('should render sync button', () => {
    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument();
  });

  it('should call triggerSync when sync button is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    await user.click(screen.getByRole('button', { name: /sync now/i }));

    expect(mockTriggerSync).toHaveBeenCalledWith('manual');
  });

  it('should disable button and show syncing text when syncing', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: null,
      isLoading: false,
      isSyncing: true,
      isPolling: false,
      triggerSync: mockTriggerSync,
      error: null,
      triggerSource: null,
      retry: vi.fn(),
      refreshStatus: vi.fn(),
      clearError: vi.fn(),
    });

    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    const button = screen.getByRole('button', { name: /syncing/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('should disable button when polling', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: null,
      isLoading: false,
      isSyncing: false,
      isPolling: true,
      triggerSync: mockTriggerSync,
      error: null,
      triggerSource: null,
      retry: vi.fn(),
      refreshStatus: vi.fn(),
      clearError: vi.fn(),
    });

    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    const button = screen.getByRole('button', { name: /syncing/i });
    expect(button).toBeDisabled();
  });

  it('should show spinner when syncing', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: null,
      isLoading: false,
      isSyncing: true,
      isPolling: false,
      triggerSync: mockTriggerSync,
      error: null,
      triggerSource: null,
      retry: vi.fn(),
      refreshStatus: vi.fn(),
      clearError: vi.fn(),
    });

    const { container } = render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    const { container } = render(<DashboardHeader user={null} syncHistory={null} loading />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not render content when loading', () => {
    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} loading />);

    expect(screen.queryByText('Hello, John')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sync/i })).not.toBeInTheDocument();
  });

  it('should render header element', () => {
    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should have accessible heading', () => {
    render(<DashboardHeader user={mockUser} syncHistory={mockSyncHistory} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello, John');
  });
});
