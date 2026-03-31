import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, screen, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { SyncStatus, SyncStage } from '@/gql/graphql';
import { SYNC_STALENESS_THRESHOLD_MS } from '@/lib/sync/constants';
import { MOCK_SYNC_HISTORIES, createMockSyncHistory } from '@/mocks/fixtures/onboarding.fixture';
import { SyncContextProvider, useSync } from './context';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/auth/context', () => ({
  useAuth: () => ({
    user: { id: 1, stravaId: 12345 },
  }),
}));

const mockNotifyGoalUpdates = vi.fn();
vi.mock('@/lib/goals/use-goal-sync-notifications', () => ({
  useGoalSyncNotifications: () => ({
    notifyGoalUpdates: mockNotifyGoalUpdates,
  }),
}));

vi.mock('@/lib/onboarding/error-handling', () => ({
  classifyOnboardingError: vi.fn((error: unknown) => ({
    type: 'UNKNOWN',
    code: 'UNKNOWN_ERROR',
    supportId: 'test-support-id',
    message: error instanceof Error ? error.message : 'Unknown error',
  })),
  logOnboardingError: vi.fn(),
}));

const mockRefetchQueries = vi.fn();
vi.mock('@apollo/client/react', async importOriginal => {
  const actual = await importOriginal<typeof import('@apollo/client/react')>();
  return {
    ...actual,
    useApolloClient: () => ({ refetchQueries: mockRefetchQueries }),
  };
});

import { toast } from 'sonner';
import { classifyOnboardingError, logOnboardingError } from '@/lib/onboarding/error-handling';

let testClient: ReturnType<typeof createTestApolloClient>;

const createTestApolloClient = () => {
  const errorLink = new ErrorLink(({ error }) => {
    if (error) console.error('[GraphQL error]:', error);
  });

  const httpLink = new HttpLink({
    uri: 'http://localhost:3011/graphql',
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        SyncHistory: {
          keyFields: ['id'],
        },
      },
    }),
    link: from([errorLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
    },
  });
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={testClient}>
      <SyncContextProvider>{children}</SyncContextProvider>
    </ApolloProvider>
  );
};

describe('SyncContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('SyncContextProvider', () => {
    it('should provide sync context to children', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
      );

      const TestComponent = () => {
        const context = useSync();
        return <div data-testid="context-available">{context ? 'yes' : 'no'}</div>;
      };

      render(
        <ApolloProvider client={testClient}>
          <SyncContextProvider>
            <TestComponent />
          </SyncContextProvider>
        </ApolloProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('context-available')).toHaveTextContent('yes');
      });
    });

    it('should initialize with null syncHistory when no data', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.syncHistory).toBeNull();
    });

    it('should fetch latest sync history on mount', async () => {
      const spy = vi.fn();
      server.use(
        graphql.query('LatestSyncHistory', () => {
          spy();
          return HttpResponse.json({
            data: { latestSyncHistory: MOCK_SYNC_HISTORIES.completed },
          });
        }),
      );

      renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('useSync', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useSync())).toThrow('useSync must be used within SyncContextProvider');

      consoleError.mockRestore();
    });

    it('should return initial loading state', async () => {
      let resolveQuery: () => void;
      const queryPromise = new Promise<void>(resolve => {
        resolveQuery = resolve;
      });

      server.use(
        graphql.query('LatestSyncHistory', async () => {
          await queryPromise;
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);

      resolveQuery!();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should return syncHistory from query', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: MOCK_SYNC_HISTORIES.completed },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.syncHistory).toBeDefined();
      expect(result.current.syncHistory?.status).toBe(SyncStatus.Completed);
    });
  });

  describe('triggerSync', () => {
    it('should call syncActivities mutation', async () => {
      const mutationSpy = vi.fn();
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          mutationSpy();
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.triggerSync();
      });

      await waitFor(() => {
        expect(mutationSpy).toHaveBeenCalled();
      });
    });

    it('should start polling after trigger', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPolling).toBe(false);

      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.isPolling).toBe(true);
    });

    it('should return false if already syncing', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.InProgress,
                stage: SyncStage.Fetching,
              }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });

      let triggerResult: boolean = true;
      act(() => {
        triggerResult = result.current.triggerSync();
      });

      expect(triggerResult).toBe(false);
    });

    it('should return false if already polling', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.isPolling).toBe(true);

      let secondTriggerResult: boolean = true;
      act(() => {
        secondTriggerResult = result.current.triggerSync();
      });

      expect(secondTriggerResult).toBe(false);
    });

    it('should set trigger source', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.triggerSync('add_sport');
      });

      expect(result.current.triggerSource).toBe('add_sport');
    });

    it('should default trigger source to manual', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.triggerSource).toBe('manual');
    });

    it('should clear previous error', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('isSyncing computed state', () => {
    it('should be true when status is InProgress', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.InProgress,
                stage: SyncStage.Fetching,
              }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSyncing).toBe(true);
    });

    it('should be true when status is Pending', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.Pending,
              }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSyncing).toBe(true);
    });

    it('should be false when status is Completed', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                completedAt: new Date(),
              }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('should be false when status is Failed', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.Failed,
              }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('refreshStatus', () => {
    it('should refetch sync history', async () => {
      const spy = vi.fn();
      server.use(
        graphql.query('LatestSyncHistory', () => {
          spy();
          return HttpResponse.json({
            data: { latestSyncHistory: MOCK_SYNC_HISTORIES.completed },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = spy.mock.calls.length;

      await act(async () => {
        await result.current.refreshStatus();
      });

      expect(spy.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should set error on refresh failure', async () => {
      let callCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          callCount++;
          if (callCount > 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      let callCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          callCount++;
          if (callCount > 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('retry', () => {
    it('should clear error and trigger sync again', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.triggerSync('add_sport');
      });

      expect(result.current.isPolling).toBe(true);
      expect(result.current.triggerSource).toBe('add_sport');

      act(() => {
        result.current.clearError();
      });

      act(() => {
        result.current.retry();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should stop polling on unmount', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result, unmount } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.isPolling).toBe(true);

      unmount();
    });
  });

  describe('sync status transitions (integration)', () => {
    it('should update syncHistory when refetch returns new data', async () => {
      let currentStatus = SyncStatus.Pending;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '1',
                status: currentStatus,
              }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.syncHistory?.status).toBe(SyncStatus.Pending);
      });

      currentStatus = SyncStatus.Completed;

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.syncHistory?.status).toBe(SyncStatus.Completed);
      });
    });

    it('should show success toast when sync completes after being triggered', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.isPolling).toBe(true);

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(toast.success).toHaveBeenCalledWith('settings.sync.syncSuccess');
    });

    it('should show error toast when sync fails after being triggered', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Failed,
                errorMessage: 'Sync failed',
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      expect(result.current.isPolling).toBe(true);

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('settings.sync.syncError');
      expect(result.current.error).not.toBeNull();
    });

    it('should notify goal updates when sync completes with goal changes', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                goalsUpdatedCount: 5,
                goalsCompletedCount: 2,
                completedGoalIds: [1, 2],
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(mockNotifyGoalUpdates).toHaveBeenCalledWith({
        goalsUpdatedCount: 5,
        goalsCompletedCount: 2,
        completedGoalIds: [1, 2],
      });
    });

    it('should not notify goal updates when sync completes without goal changes', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                goalsUpdatedCount: null,
                goalsCompletedCount: null,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(mockNotifyGoalUpdates).not.toHaveBeenCalled();
    });

    it('should show rate_limit toast when sync fails with rate limit error', async () => {
      vi.mocked(classifyOnboardingError).mockReturnValue({
        type: 'rate_limit',
        code: 'STRAVA_RATE_LIMIT_EXCEEDED',
        supportId: 'test-support-id',
        message: 'Rate limit reached',
        retriable: true,
      });

      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Failed,
                errorMessage: 'Strava rate limit exceeded during activities fetch.',
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'settings.sync.rateLimitError',
        expect.objectContaining({ id: 'onboarding-rate-limit', duration: Infinity, dismissible: true }),
      );
      expect(toast.error).not.toHaveBeenCalledWith('settings.sync.syncError');
    });

    it('should show daily rate_limit toast when sync fails with non-retriable rate limit', async () => {
      vi.mocked(classifyOnboardingError).mockReturnValue({
        type: 'rate_limit',
        code: 'STRAVA_RATE_LIMIT_EXCEEDED',
        supportId: 'test-support-id',
        message: 'Daily rate limit reached',
        retriable: false,
      });

      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Failed,
                errorMessage: 'Strava daily rate limit reached. Try again tomorrow.',
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'settings.sync.rateLimitDailyError',
        expect.objectContaining({ id: 'onboarding-rate-limit', duration: Infinity, dismissible: true }),
      );
    });

    it('should classify and log errors on sync failure', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Failed,
                errorMessage: 'Database error',
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(classifyOnboardingError).toHaveBeenCalled();
      expect(logOnboardingError).toHaveBeenCalled();
    });
  });

  describe('staleness check', () => {
    it('should auto-trigger sync when completedAt is older than the threshold', async () => {
      const staleCompletedAt = new Date(Date.now() - SYNC_STALENESS_THRESHOLD_MS - 60 * 60 * 1000);

      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                completedAt: staleCompletedAt,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: { syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }) },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.triggerSource).toBe('auto');
      });
    });

    it('should not auto-trigger sync when completedAt is within the threshold', async () => {
      const freshCompletedAt = new Date(Date.now() - 60 * 60 * 1000);
      const mutationSpy = vi.fn();

      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                completedAt: freshCompletedAt,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          mutationSpy();
          return HttpResponse.json({
            data: { syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }) },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(mutationSpy).not.toHaveBeenCalled();
      expect(result.current.triggerSource).toBeNull();
    });

    it('should auto-trigger sync when completedAt is null (no prior sync)', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                completedAt: null,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: { syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }) },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.triggerSource).toBe('auto');
      });
    });

    it('should not auto-trigger sync when a sync is already in progress at load', async () => {
      const mutationSpy = vi.fn();

      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                status: SyncStatus.InProgress,
                stage: SyncStage.Fetching,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          mutationSpy();
          return HttpResponse.json({
            data: { syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }) },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isSyncing).toBe(true);
      });

      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(mutationSpy).not.toHaveBeenCalled();
    });

    it('should only check staleness once even when syncHistory changes afterward', async () => {
      const staleCompletedAt = new Date(Date.now() - SYNC_STALENESS_THRESHOLD_MS - 60 * 60 * 1000);
      let queryCount = 0;
      const mutationSpy = vi.fn();

      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: String(queryCount),
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                completedAt: staleCompletedAt,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          mutationSpy();
          return HttpResponse.json({
            data: { syncActivities: createMockSyncHistory({ status: SyncStatus.Pending }) },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.triggerSource).toBe('auto');
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      expect(mutationSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('post-sync data refresh', () => {
    it('should refetch dashboard and goals queries when sync completes', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync('manual');
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(mockRefetchQueries).toHaveBeenCalledWith({
        include: [
          'DashboardData',
          'Goals',
          'ActiveGoals',
          'SportPeriodStatistics',
          'SportProgressionData',
          'SportAverageMetrics',
          'PersonalRecords',
        ],
      });
    });

    it('should not refetch when sync fails', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Failed,
                errorMessage: 'Sync failed',
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.id).toBe('1');
      });

      act(() => {
        result.current.triggerSync();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(mockRefetchQueries).not.toHaveBeenCalled();
    });

    it('should refetch when auto-triggered sync completes', async () => {
      let queryCount = 0;
      server.use(
        graphql.query('LatestSyncHistory', () => {
          queryCount++;
          if (queryCount === 1) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '1',
                  status: SyncStatus.Completed,
                  stage: SyncStage.Done,
                  completedAt: new Date(Date.now() - SYNC_STALENESS_THRESHOLD_MS - 60 * 60 * 1000),
                }),
              },
            });
          }
          if (queryCount === 2) {
            return HttpResponse.json({
              data: {
                latestSyncHistory: createMockSyncHistory({
                  id: '2',
                  status: SyncStatus.InProgress,
                  stage: SyncStage.Fetching,
                }),
              },
            });
          }
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '2',
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
              }),
            },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: {
              syncActivities: createMockSyncHistory({ id: '2', status: SyncStatus.Pending }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.triggerSource).toBe('auto');
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await act(async () => {
        await result.current.refreshStatus();
      });

      await waitFor(() => {
        expect(result.current.isPolling).toBe(false);
      });

      expect(mockRefetchQueries).toHaveBeenCalledWith({
        include: [
          'DashboardData',
          'Goals',
          'ActiveGoals',
          'SportPeriodStatistics',
          'SportProgressionData',
          'SportAverageMetrics',
          'PersonalRecords',
        ],
      });
    });

    it('should not refetch when no polling was active at load', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: {
              latestSyncHistory: createMockSyncHistory({
                id: '1',
                status: SyncStatus.Completed,
                stage: SyncStage.Done,
                completedAt: new Date(),
              }),
            },
          });
        }),
      );

      const { result } = renderHook(() => useSync(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.syncHistory?.status).toBe(SyncStatus.Completed);
      });

      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(mockRefetchQueries).not.toHaveBeenCalled();
    });
  });
});
