import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_USERS } from '@/mocks/handlers';
import { MOCK_SYNC_HISTORIES } from '@/mocks/fixtures/onboarding.fixture';
import { useSyncProgress } from './use-sync-progress';
import { AuthContextProvider } from '../auth/context';
import type { User } from '@/lib/graphql';

let testClient: ReturnType<typeof createTestApolloClient>;

const createTestApolloClient = () => {
  const errorLink = new ErrorLink(({ error }) => {
    console.error('[GraphQL error]:', error);
  });

  const httpLink = new HttpLink({
    uri: 'http://localhost:3011/graphql',
    credentials: 'include',
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([errorLink, httpLink]),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
    },
  });
};

const createWrapper =
  (initialUser: User | null) =>
  ({ children }: { children: React.ReactNode }) => {
    return (
      <ApolloProvider client={testClient}>
        <AuthContextProvider initialUser={initialUser}>{children}</AuthContextProvider>
      </ApolloProvider>
    );
  };

const { mockRouterPush, mockRouterRefresh, mockToast, mockUseTranslations } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockRouterRefresh: vi.fn(),
  mockToast: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockUseTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));

describe('useSyncProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Initialization', () => {
    it('should initialize and call syncActivities when no existing sync', async () => {
      const syncActivitiesSpy = vi.fn();

      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({ data: { syncStatus: null } });
        }),
        graphql.mutation('SyncActivities', () => {
          syncActivitiesSpy();
          return HttpResponse.json({
            data: { syncActivities: MOCK_SYNC_HISTORIES.pending },
          });
        }),
      );

      renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(syncActivitiesSpy).toHaveBeenCalledOnce();
      });
    });

    it('should not call syncActivities when sync already exists', async () => {
      const syncActivitiesSpy = vi.fn();

      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({
            data: { syncStatus: MOCK_SYNC_HISTORIES.fetchingInProgress },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          syncActivitiesSpy();
          return HttpResponse.json({
            data: { syncActivities: MOCK_SYNC_HISTORIES.pending },
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.syncStatus).not.toBeNull();
      });

      expect(syncActivitiesSpy).not.toHaveBeenCalled();
    });

    it('should show existing sync status', async () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({
            data: { syncStatus: MOCK_SYNC_HISTORIES.fetchingInProgress },
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.syncStatus).not.toBeNull();
      });

      expect(result.current.syncStatus?.status).toBe(MOCK_SYNC_HISTORIES.fetchingInProgress.status);
      expect(result.current.syncStatus?.stage).toBe(MOCK_SYNC_HISTORIES.fetchingInProgress.stage);
      expect(result.current.error).toBeNull();
      expect(result.current.isInitializing).toBe(false);
    });

    it('should set redirecting state when sync is completed', async () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({
            data: { syncStatus: MOCK_SYNC_HISTORIES.completed },
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.isRedirecting).toBe(true);
      });
    });

    it('should show error when sync has failed', async () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({
            data: { syncStatus: MOCK_SYNC_HISTORIES.failed },
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.type).toBeDefined();
      expect(result.current.error?.supportId).toMatch(/^E-[A-Z0-9]{6}$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle network error during initialization', async () => {
      server.use(graphql.query('SyncStatus', () => HttpResponse.error()));

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.type).toBe('network');
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should handle rate limit errors', async () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Too many requests',
                extensions: { code: 'RATE_LIMIT_EXCEEDED' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.type).toBe('rate_limit');
    });
  });

  describe('Retry Functionality', () => {
    it('should call syncActivities again after retry', async () => {
      const syncActivitiesSpy = vi.fn();
      let attemptCount = 0;

      server.use(
        graphql.query('SyncStatus', () => {
          attemptCount++;
          if (attemptCount === 1) {
            return HttpResponse.json({
              data: { syncStatus: MOCK_SYNC_HISTORIES.failed },
            });
          }
          return HttpResponse.json({
            data: { syncStatus: MOCK_SYNC_HISTORIES.pending },
          });
        }),
        graphql.mutation('SyncActivities', () => {
          syncActivitiesSpy();
          return HttpResponse.json({
            data: { syncActivities: MOCK_SYNC_HISTORIES.pending },
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      result.current.handleRetry();

      await waitFor(() => {
        expect(syncActivitiesSpy).toHaveBeenCalled();
      });
    });
  });

  describe('State Properties', () => {
    it('should have correct initial state when loading', () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({ data: { syncStatus: null } });
        }),
        graphql.mutation('SyncActivities', () => {
          return HttpResponse.json({
            data: { syncActivities: MOCK_SYNC_HISTORIES.pending },
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      expect(result.current.syncStatus).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isRedirecting).toBe(false);
      expect(result.current.handleRetry).toBeInstanceOf(Function);
    });

    it('should mark as initializing when no status and no error', () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return new Promise(() => {});
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      expect(result.current.isInitializing).toBe(true);
    });

    it('should not be initializing when error exists', async () => {
      server.use(graphql.query('SyncStatus', () => HttpResponse.error()));

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.isInitializing).toBe(false);
    });

    it('should not be initializing when redirecting', async () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({
            data: { syncStatus: MOCK_SYNC_HISTORIES.completed },
          });
        }),
      );

      const { result } = renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(() => {
        expect(result.current.isRedirecting).toBe(true);
      });

      expect(result.current.isInitializing).toBe(false);
    });
  });

  describe('Redirect Behavior', () => {
    it('should eventually redirect to dashboard after completion', async () => {
      server.use(
        graphql.query('SyncStatus', () => {
          return HttpResponse.json({
            data: { syncStatus: MOCK_SYNC_HISTORIES.completed },
          });
        }),
      );

      renderHook(() => useSyncProgress(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await waitFor(
        () => {
          expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
        },
        { timeout: 3000 },
      );
    });
  });
});
