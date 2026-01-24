import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_USER_PREFERENCES } from '@/mocks/fixtures/settings.fixture';
import { settingsErrorHandlers } from '@/mocks/handlers';
import { useUserPreferences } from './use-user-preferences';

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
        UserPreferences: {
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

describe('useUserPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching preferences', () => {
    it('should fetch user preferences successfully', async () => {
      server.use(
        graphql.query('UserPreferences', () => {
          return HttpResponse.json({
            data: { userPreferences: MOCK_USER_PREFERENCES.default },
          });
        }),
      );

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.preferences).not.toBeNull();
      expect(result.current.preferences?.selectedSports).toEqual(MOCK_USER_PREFERENCES.default.selectedSports);
      expect(result.current.error).toBeUndefined();
    });

    it('should return null when no preferences', async () => {
      server.use(
        graphql.query('UserPreferences', () => {
          return HttpResponse.json({
            data: { userPreferences: null },
          });
        }),
      );

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.preferences).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(settingsErrorHandlers.userPreferencesNetworkError);

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.preferences).toBeNull();
    });

    it('should handle GraphQL errors', async () => {
      server.use(settingsErrorHandlers.userPreferencesUnauthenticated);

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Refetch', () => {
    it('should refetch preferences', async () => {
      const spy = vi.fn();

      server.use(
        graphql.query('UserPreferences', () => {
          spy();
          return HttpResponse.json({
            data: { userPreferences: MOCK_USER_PREFERENCES.default },
          });
        }),
      );

      const { result } = renderHook(() => useUserPreferences(), {
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
