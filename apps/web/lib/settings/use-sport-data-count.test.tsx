import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_SPORT_DATA_COUNTS } from '@/mocks/fixtures/settings.fixture';
import { settingsErrorHandlers } from '@/mocks/handlers';
import { SportType } from '@/gql/graphql';
import { useSportDataCount } from './use-sport-data-count';

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

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ApolloProvider client={testClient}>{children}</ApolloProvider>
  );
};

describe('useSportDataCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching data count', () => {
    it('should fetch sport data count successfully', async () => {
      server.use(
        graphql.query('SportDataCount', () => {
          return HttpResponse.json({
            data: { sportDataCount: MOCK_SPORT_DATA_COUNTS.withData },
          });
        }),
      );

      const { result } = renderHook(() => useSportDataCount(SportType.Run), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.activitiesCount).toBe(MOCK_SPORT_DATA_COUNTS.withData.activitiesCount);
      expect(result.current.data?.goalsCount).toBe(MOCK_SPORT_DATA_COUNTS.withData.goalsCount);
      expect(result.current.error).toBeUndefined();
    });

    it('should skip query when sport is null', async () => {
      const spy = vi.fn();

      server.use(
        graphql.query('SportDataCount', () => {
          spy();
          return HttpResponse.json({
            data: { sportDataCount: MOCK_SPORT_DATA_COUNTS.withData },
          });
        }),
      );

      const { result } = renderHook(() => useSportDataCount(null), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(spy).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });

    it('should return empty counts', async () => {
      server.use(
        graphql.query('SportDataCount', () => {
          return HttpResponse.json({
            data: { sportDataCount: MOCK_SPORT_DATA_COUNTS.empty },
          });
        }),
      );

      const { result } = renderHook(() => useSportDataCount(SportType.Swim), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data?.activitiesCount).toBe(0);
      expect(result.current.data?.goalsCount).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(settingsErrorHandlers.sportDataCountNetworkError);

      const { result } = renderHook(() => useSportDataCount(SportType.Run), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeNull();
    });
  });
});
