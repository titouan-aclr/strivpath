import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_ACTIVITIES_ARRAY } from '@/mocks/fixtures/activity.fixture';
import { useActivities } from './use-activities';
import { ActivityType } from '@/gql/graphql';
import { OrderBy, OrderDirection } from './constants';
import type { ActivityFilter } from './types';
import type { ReactNode } from 'react';

interface ActivitiesFilterInput {
  offset?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  orderBy?: string;
  orderDirection?: string;
}

function serializeActivity(activity: (typeof MOCK_ACTIVITIES_ARRAY)[number]) {
  return {
    ...activity,
    stravaId: activity.stravaId.toString(),
  };
}

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
        Query: {
          fields: {
            activities: {
              keyArgs: ['filter', ['type']],
              merge(existing: unknown[] = [], incoming: unknown[]): unknown[] {
                return [...existing, ...incoming];
              },
            },
          },
        },
        Activity: {
          keyFields: ['stravaId'],
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

let testClient = createTestApolloClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => {
    return <ApolloProvider client={testClient}>{children}</ApolloProvider>;
  };
};

describe('useActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Initial Load', () => {
    it('should fetch first page of activities on mount', async () => {
      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.activities).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toHaveLength(20);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.error).toBeFalsy();
    });

    it('should indicate no more results when fewer than pageSize returned', async () => {
      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            data: { activities: MOCK_ACTIVITIES_ARRAY.slice(0, 10).map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toHaveLength(10);
      expect(result.current.hasMore).toBe(false);
    });

    it('should handle empty result set', async () => {
      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({ data: { activities: [] } });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('Load More', () => {
    it('should append next page when loadMore is called', async () => {
      let requestCount = 0;

      server.use(
        graphql.query('Activities', ({ variables }) => {
          requestCount++;
          const filter = variables.filter as ActivitiesFilterInput | undefined;
          const offset = filter?.offset ?? 0;
          const limit = filter?.limit ?? 20;

          return HttpResponse.json({
            data: {
              activities: MOCK_ACTIVITIES_ARRAY.slice(offset, offset + limit).map(serializeActivity),
            },
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(20);
      });

      const firstPageActivities = [...result.current.activities];

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(20);
      });

      expect(result.current.activities.length).toBeGreaterThanOrEqual(20);
      expect(result.current.activities.slice(0, 20)).toEqual(firstPageActivities);
      expect(requestCount).toBeGreaterThanOrEqual(2);
    });

    it('should set hasMore to false when last page is reached', async () => {
      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as ActivitiesFilterInput | undefined;
          const offset = filter?.offset ?? 0;

          if (offset === 0) {
            return HttpResponse.json({
              data: { activities: MOCK_ACTIVITIES_ARRAY.slice(0, 20).map(serializeActivity) },
            });
          }

          return HttpResponse.json({
            data: { activities: MOCK_ACTIVITIES_ARRAY.slice(20, 25).map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });

      expect(result.current.activities.length).toBeGreaterThan(20);
    });

    it('should not call loadMore when already loading', async () => {
      let requestCount = 0;

      server.use(
        graphql.query('Activities', () => {
          requestCount++;
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(
                HttpResponse.json({
                  data: { activities: MOCK_ACTIVITIES_ARRAY.slice(0, 20).map(serializeActivity) },
                }),
              );
            }, 100);
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      act(() => {
        void result.current.loadMore();
        void result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(requestCount).toBe(1);
    });

    it('should not call loadMore when hasMore is false', async () => {
      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            data: { activities: MOCK_ACTIVITIES_ARRAY.slice(0, 10).map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });

      const activitiesBeforeLoadMore = result.current.activities.length;

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.activities).toHaveLength(activitiesBeforeLoadMore);
    });

    it('should increment offset correctly', async () => {
      const offsets: number[] = [];

      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as ActivitiesFilterInput | undefined;
          const offset = filter?.offset ?? 0;
          offsets.push(offset);
          const limit = filter?.limit ?? 20;

          return HttpResponse.json({
            data: {
              activities: MOCK_ACTIVITIES_ARRAY.slice(offset, offset + limit).map(serializeActivity),
            },
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(20);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(20);
      });

      expect(offsets).toContain(0);
      expect(offsets).toContain(20);
    });
  });

  describe('Filter Changes', () => {
    it('should refetch when sport type filter changes', async () => {
      const { result, rerender } = renderHook(
        (props: { filter?: ActivityFilter }) => useActivities({ filter: props.filter }),
        {
          wrapper: createWrapper(),
          initialProps: {},
        },
      );

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(0);
      });

      const allActivitiesCount = result.current.activities.length;

      rerender({ filter: { type: ActivityType.Run } });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const runActivities = result.current.activities.filter(a => a.type === (ActivityType.Run as string));
      expect(runActivities.length).toBe(result.current.activities.length);
      expect(result.current.activities.length).toBeLessThanOrEqual(allActivitiesCount);
    });

    it('should refetch when date range filter changes', async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const { result } = renderHook(
        () => useActivities({ filter: { type: ActivityType.Run, startDate: sevenDaysAgo } }),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities.length).toBeGreaterThan(0);
      expect(
        result.current.activities.every(
          a => a.type === (ActivityType.Run as string) && new Date(a.startDate) >= sevenDaysAgo,
        ),
      ).toBe(true);
    });

    it('should refetch when sort order changes', async () => {
      const { result, rerender } = renderHook(
        (props: { filter?: ActivityFilter }) => useActivities({ filter: props.filter }),
        {
          wrapper: createWrapper(),
          initialProps: {
            filter: { orderBy: OrderBy.Date, orderDirection: OrderDirection.Desc },
          },
        },
      );

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(0);
      });

      rerender({
        filter: { orderBy: OrderBy.Distance, orderDirection: OrderDirection.Desc },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    it('should reset offset when filter changes', async () => {
      const offsets: number[] = [];

      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as ActivitiesFilterInput | undefined;
          const offset = filter?.offset ?? 0;
          offsets.push(offset);
          const limit = filter?.limit ?? 20;

          return HttpResponse.json({
            data: {
              activities: MOCK_ACTIVITIES_ARRAY.slice(offset, offset + limit).map(serializeActivity),
            },
          });
        }),
      );

      const { result, rerender } = renderHook(
        (props: { filter?: ActivityFilter }) => useActivities({ filter: props.filter }),
        {
          wrapper: createWrapper(),
          initialProps: {},
        },
      );

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(20);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(20);
      });

      offsets.length = 0;

      rerender({ filter: { type: ActivityType.Run } });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(offsets[0]).toBe(0);
    });
  });

  describe('Refetch', () => {
    it('should refetch from beginning when refetch is called', async () => {
      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as ActivitiesFilterInput | undefined;
          const offset = filter?.offset ?? 0;
          const limit = filter?.limit ?? 20;

          return HttpResponse.json({
            data: {
              activities: MOCK_ACTIVITIES_ARRAY.slice(offset, offset + limit).map(serializeActivity),
            },
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(20);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.activities.length).toBeGreaterThan(20);
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toHaveLength(20);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('Activities', () => HttpResponse.error()));

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.activities).toEqual([]);
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Internal server error',
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.activities).toEqual([]);
    });

    it('should recover from error after refetch', async () => {
      server.use(graphql.query('Activities', () => HttpResponse.error()));

      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            data: { activities: MOCK_ACTIVITIES_ARRAY.slice(0, 20).map(serializeActivity) },
          });
        }),
      );

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.error).toBeFalsy();
      });

      expect(result.current.activities).toHaveLength(20);
    });
  });
});
