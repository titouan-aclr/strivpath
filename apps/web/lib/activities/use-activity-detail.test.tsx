import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { useActivityDetail } from './use-activity-detail';
import { SportType } from '@/gql/graphql';
import type { ReactNode } from 'react';

const MOCK_ACTIVITY = {
  __typename: 'Activity' as const,
  id: '1',
  stravaId: '123456',
  name: 'Morning Run',
  type: SportType.Run,
  distance: 5000,
  movingTime: 1800,
  elapsedTime: 1900,
  totalElevationGain: 100,
  startDate: '2025-01-15T08:00:00Z',
  startDateLocal: '2025-01-15T09:00:00Z',
  timezone: 'Europe/Paris',
  averageSpeed: 2.78,
  maxSpeed: 3.5,
  kudosCount: 5,
  hasKudoed: false,
  averageHeartrate: null,
  maxHeartrate: null,
  kilojoules: null,
  deviceWatts: false,
  averageCadence: null,
  calories: null,
  elevHigh: null,
  elevLow: null,
  averageWatts: null,
  weightedAverageWatts: null,
  maxWatts: null,
  splits: null,
  createdAt: '2025-01-15T08:00:00Z',
  updatedAt: '2025-01-15T08:00:00Z',
};

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
  });
};

function Wrapper({ children }: { children: ReactNode }) {
  const client = createTestApolloClient();
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

describe('useActivityDetail', () => {
  beforeEach(() => {
    server.use(
      graphql.query('Activity', ({ variables }) => {
        if (variables.stravaId === '123456') {
          return HttpResponse.json({
            data: {
              activity: MOCK_ACTIVITY,
            },
          });
        }
        return HttpResponse.json({
          data: {
            activity: null,
          },
        });
      }),
    );
  });

  describe('ID validation', () => {
    it('should validate positive integer IDs', () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: '123456' }), {
        wrapper: Wrapper,
      });

      expect(result.current.isValidId).toBe(true);
    });

    it('should reject negative IDs', () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: '-123' }), {
        wrapper: Wrapper,
      });

      expect(result.current.isValidId).toBe(false);
    });

    it('should reject zero', () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: '0' }), {
        wrapper: Wrapper,
      });

      expect(result.current.isValidId).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: 'abc' }), {
        wrapper: Wrapper,
      });

      expect(result.current.isValidId).toBe(false);
    });
  });

  describe('Data fetching', () => {
    it('should be loading initially for valid IDs', () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: '123456' }), {
        wrapper: Wrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.activity).toBeNull();
    });

    it('should not load for invalid IDs', () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: 'invalid' }), {
        wrapper: Wrapper,
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.activity).toBeNull();
    });

    it('should fetch activity data with valid ID', async () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: '123456' }), {
        wrapper: Wrapper,
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activity).toBeTruthy();
      expect(result.current.activity?.name).toBe('Morning Run');
      expect(result.current.activity?.stravaId).toBe('123456');
    });

    it('should return null for non-existent activity', async () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: '999999' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activity).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(
        graphql.query('Activity', () => {
          return HttpResponse.error();
        }),
      );

      const { result } = renderHook(() => useActivityDetail({ stravaId: '123456' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.activity).toBeNull();
    });
  });

  describe('Refetch', () => {
    it('should provide a refetch function', async () => {
      const { result } = renderHook(() => useActivityDetail({ stravaId: '123456' }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.refetch).toBeInstanceOf(Function);
    });
  });
});
