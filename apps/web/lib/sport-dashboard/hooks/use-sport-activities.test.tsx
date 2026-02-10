import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_ACTIVITIES_ARRAY } from '@/mocks/fixtures/activity.fixture';
import { SportType, ActivityType } from '@/gql/graphql';
import { useSportActivities } from './use-sport-activities';
import type { ReactNode } from 'react';

function serializeActivity(activity: (typeof MOCK_ACTIVITIES_ARRAY)[number]) {
  return {
    ...activity,
    stravaId: activity.stravaId.toString(),
  };
}

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

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => <ApolloProvider client={testClient}>{children}</ApolloProvider>;
};

describe('useSportActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching activities', () => {
    it('should fetch activities for a specific sport type', async () => {
      const runActivities = MOCK_ACTIVITIES_ARRAY.filter(a => a.type === 'RUN').slice(0, 10);

      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as { type?: string };
          expect(filter?.type).toBe(ActivityType.Run);

          return HttpResponse.json({
            data: { activities: runActivities.map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities.length).toBeLessThanOrEqual(5);
      expect(result.current.error).toBeUndefined();
    });

    it('should respect the limit parameter', async () => {
      const activities = MOCK_ACTIVITIES_ARRAY.slice(0, 10);

      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            data: { activities: activities.map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run, limit: 3 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities.length).toBeLessThanOrEqual(3);
    });

    it('should use default limit of 5', async () => {
      const activities = MOCK_ACTIVITIES_ARRAY.slice(0, 10);

      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            data: { activities: activities.map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Sport type mapping', () => {
    it('should map Run sport to RUN activity type', async () => {
      const filterSpy = vi.fn();

      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as { type?: string };
          filterSpy(filter?.type);
          return HttpResponse.json({
            data: { activities: [] },
          });
        }),
      );

      renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(filterSpy).toHaveBeenCalled();
      });

      expect(filterSpy).toHaveBeenCalledWith(ActivityType.Run);
    });

    it('should map Ride sport to RIDE activity type', async () => {
      const filterSpy = vi.fn();

      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as { type?: string };
          filterSpy(filter?.type);
          return HttpResponse.json({
            data: { activities: [] },
          });
        }),
      );

      renderHook(() => useSportActivities({ sportType: SportType.Ride }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(filterSpy).toHaveBeenCalled();
      });

      expect(filterSpy).toHaveBeenCalledWith(ActivityType.Ride);
    });

    it('should map Swim sport to SWIM activity type', async () => {
      const filterSpy = vi.fn();

      server.use(
        graphql.query('Activities', ({ variables }) => {
          const filter = variables.filter as { type?: string };
          filterSpy(filter?.type);
          return HttpResponse.json({
            data: { activities: [] },
          });
        }),
      );

      renderHook(() => useSportActivities({ sportType: SportType.Swim }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(filterSpy).toHaveBeenCalled();
      });

      expect(filterSpy).toHaveBeenCalledWith(ActivityType.Swim);
    });
  });

  describe('Empty state', () => {
    it('should handle empty activities', async () => {
      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            data: { activities: [] },
          });
        }),
      );

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activities).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('Activities', () => HttpResponse.error()));

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
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

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Refetch', () => {
    it('should refetch activities when refetch is called', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('Activities', () => {
          querySpy();
          return HttpResponse.json({
            data: { activities: MOCK_ACTIVITIES_ARRAY.slice(0, 5).map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(querySpy).toHaveBeenCalled();
      const initialCallCount = querySpy.mock.calls.length;

      await act(async () => {
        await result.current.refetch();
      });

      expect(querySpy.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Activity data structure', () => {
    it('should return activities with correct structure', async () => {
      const activities = MOCK_ACTIVITIES_ARRAY.slice(0, 5);

      server.use(
        graphql.query('Activities', () => {
          return HttpResponse.json({
            data: { activities: activities.map(serializeActivity) },
          });
        }),
      );

      const { result } = renderHook(() => useSportActivities({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      if (result.current.activities.length > 0) {
        const activity = result.current.activities[0];
        expect(activity).toHaveProperty('stravaId');
        expect(activity).toHaveProperty('name');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('distance');
        expect(activity).toHaveProperty('movingTime');
      }
    });
  });
});
