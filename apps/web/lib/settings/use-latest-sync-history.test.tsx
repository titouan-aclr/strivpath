import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_SYNC_HISTORIES } from '@/mocks/fixtures/onboarding.fixture';
import { settingsErrorHandlers } from '@/mocks/handlers';
import { useLatestSyncHistory } from './use-latest-sync-history';

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
        fetchPolicy: 'cache-and-network',
      },
    },
  });
};

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={testClient}>{children}</ApolloProvider>
  );
};

describe('useLatestSyncHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching sync history', () => {
    it('should fetch latest sync history successfully', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: MOCK_SYNC_HISTORIES.completed },
          });
        }),
      );

      const { result } = renderHook(() => useLatestSyncHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.syncHistory).not.toBeNull();
      expect(result.current.syncHistory?.status).toBe(MOCK_SYNC_HISTORIES.completed.status);
      expect(result.current.error).toBeUndefined();
    });

    it('should return null when no sync history', async () => {
      server.use(
        graphql.query('LatestSyncHistory', () => {
          return HttpResponse.json({
            data: { latestSyncHistory: null },
          });
        }),
      );

      const { result } = renderHook(() => useLatestSyncHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.syncHistory).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(settingsErrorHandlers.latestSyncHistoryNetworkError);

      const { result } = renderHook(() => useLatestSyncHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.syncHistory).toBeNull();
    });
  });

  describe('Refetch', () => {
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

      const { result } = renderHook(() => useLatestSyncHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(spy).toHaveBeenCalledTimes(1);

      await result.current.refetch();

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
