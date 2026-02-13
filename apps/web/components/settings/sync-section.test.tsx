import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncSection } from './sync-section';
import { SyncStatus, SyncStage } from '@/gql/graphql';
import * as useSyncContext from '@/lib/sync/context';

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

vi.mock('@/lib/sync/context');

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '5 minutes ago',
}));

describe('SyncSection', () => {
  const mockTriggerSync = vi.fn();

  const createMockSyncHistory = (overrides = {}) => ({
    id: '1',
    userId: 1,
    status: SyncStatus.Completed,
    stage: SyncStage.Done,
    totalActivities: 100,
    processedActivities: 100,
    errorMessage: null,
    startedAt: new Date(),
    completedAt: new Date(),
    goalsUpdatedCount: null,
    goalsCompletedCount: null,
    completedGoalIds: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory(),
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

  it('should render section title and description', () => {
    render(<SyncSection />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should display last sync time', () => {
    render(<SyncSection />);

    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
  });

  it('should display "never" when no sync history', () => {
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

    render(<SyncSection />);

    expect(screen.getByText('never')).toBeInTheDocument();
  });

  it('should display "never" when no completedAt date', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ completedAt: null }),
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

    render(<SyncSection />);

    expect(screen.getByText('never')).toBeInTheDocument();
  });

  it('should display sync status badge', () => {
    render(<SyncSection />);

    expect(screen.getByText('status.done')).toBeInTheDocument();
  });

  it('should display correct status for completed', () => {
    render(<SyncSection />);

    const badge = screen.getByText('status.done');
    expect(badge).toBeInTheDocument();
  });

  it('should display correct status for failed', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.Failed, stage: SyncStage.Fetching }),
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

    render(<SyncSection />);

    expect(screen.getByText('status.failed')).toBeInTheDocument();
  });

  it('should display correct status for in progress', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.InProgress, stage: SyncStage.Fetching }),
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

    render(<SyncSection />);

    expect(screen.getByText('status.fetching')).toBeInTheDocument();
  });

  it('should display activities count', () => {
    render(<SyncSection />);

    expect(screen.getByText('activitiesImported:{"count":100}')).toBeInTheDocument();
  });

  it('should not display activities count when null', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ totalActivities: null }),
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

    render(<SyncSection />);

    expect(screen.queryByText(/activitiesImported/)).not.toBeInTheDocument();
  });

  it('should not display activities count when zero', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ totalActivities: 0 }),
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

    render(<SyncSection />);

    expect(screen.queryByText(/activitiesImported/)).not.toBeInTheDocument();
  });

  it('should render sync now button', () => {
    render(<SyncSection />);

    expect(screen.getByRole('button', { name: /syncNow/i })).toBeInTheDocument();
  });

  it('should disable button when syncing', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.InProgress }),
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

    render(<SyncSection />);

    const button = screen.getByRole('button', { name: /syncing/i });
    expect(button).toBeDisabled();
  });

  it('should disable button when polling', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory(),
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

    render(<SyncSection />);

    const button = screen.getByRole('button', { name: /syncing/i });
    expect(button).toBeDisabled();
  });

  it('should show spinner when syncing', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory(),
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

    const { container } = render(<SyncSection />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should call triggerSync on button click', async () => {
    const user = userEvent.setup();
    render(<SyncSection />);

    const button = screen.getByRole('button', { name: /syncNow/i });
    await user.click(button);

    expect(mockTriggerSync).toHaveBeenCalledWith('manual');
  });

  it('should show loading skeleton when loading', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: null,
      isLoading: true,
      isSyncing: false,
      isPolling: false,
      triggerSync: mockTriggerSync,
      error: null,
      triggerSource: null,
      retry: vi.fn(),
      refreshStatus: vi.fn(),
      clearError: vi.fn(),
    });

    const { container } = render(<SyncSection />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display stage-specific status for storing', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.InProgress, stage: SyncStage.Storing }),
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

    render(<SyncSection />);

    expect(screen.getByText('status.storing')).toBeInTheDocument();
  });

  it('should display stage-specific status for computing', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.InProgress, stage: SyncStage.Computing }),
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

    render(<SyncSection />);

    expect(screen.getByText('status.computing')).toBeInTheDocument();
  });

  it('should display pending status', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.Pending, stage: null }),
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

    render(<SyncSection />);

    expect(screen.getByText('status.pending')).toBeInTheDocument();
  });

  it('should display green check icon for completed status', () => {
    const { container } = render(<SyncSection />);

    const checkIcon = container.querySelector('.text-green-500');
    expect(checkIcon).toBeInTheDocument();
  });

  it('should display destructive icon for failed status', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.Failed }),
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

    const { container } = render(<SyncSection />);

    const errorIcon = container.querySelector('.text-destructive');
    expect(errorIcon).toBeInTheDocument();
  });

  it('should display orange spinner for in progress status', () => {
    vi.mocked(useSyncContext.useSync).mockReturnValue({
      syncHistory: createMockSyncHistory({ status: SyncStatus.InProgress, stage: SyncStage.Fetching }),
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

    const { container } = render(<SyncSection />);

    const orangeSpinner = container.querySelector('.text-primary.animate-spin');
    expect(orangeSpinner).toBeInTheDocument();
  });
});
