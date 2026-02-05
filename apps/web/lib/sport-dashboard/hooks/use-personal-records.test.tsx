import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_PERSONAL_RECORDS } from '@/mocks/fixtures/sport-dashboard.fixture';
import { SportType } from '@/gql/graphql';
import { usePersonalRecords } from './use-personal-records';
import type { ReactNode } from 'react';

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
        fetchPolicy: 'cache-and-network',
      },
    },
  });
};

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => <ApolloProvider client={testClient}>{children}</ApolloProvider>;
};

describe('usePersonalRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Fetching personal records', () => {
    it('should fetch personal records successfully', async () => {
      server.use(
        graphql.query('PersonalRecords', ({ variables }) => {
          const sportType = variables.sportType as SportType;
          return HttpResponse.json({
            data: { personalRecords: MOCK_PERSONAL_RECORDS[sportType] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.records.length).toBe(3);
      expect(result.current.records[0].type).toBe(MOCK_PERSONAL_RECORDS[SportType.Run][0].type);
      expect(result.current.records[0].value).toBe(MOCK_PERSONAL_RECORDS[SportType.Run][0].value);
      expect(result.current.records[0].activityId).toBe(MOCK_PERSONAL_RECORDS[SportType.Run][0].activityId);
      expect(result.current.error).toBeUndefined();
    });

    it('should return empty array when no records', async () => {
      server.use(
        graphql.query('PersonalRecords', () => {
          return HttpResponse.json({
            data: { personalRecords: [] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.records).toEqual([]);
    });
  });

  describe('Different sports', () => {
    it('should fetch correct records for Run sport', async () => {
      server.use(
        graphql.query('PersonalRecords', ({ variables }) => {
          const sportType = variables.sportType as SportType;
          return HttpResponse.json({
            data: { personalRecords: MOCK_PERSONAL_RECORDS[sportType] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const recordTypes = result.current.records.map(r => r.type);
      expect(recordTypes).toContain('longest_distance');
      expect(recordTypes).toContain('best_pace_5k');
    });

    it('should fetch correct records for Ride sport', async () => {
      server.use(
        graphql.query('PersonalRecords', ({ variables }) => {
          const sportType = variables.sportType as SportType;
          return HttpResponse.json({
            data: { personalRecords: MOCK_PERSONAL_RECORDS[sportType] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Ride }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const recordTypes = result.current.records.map(r => r.type);
      expect(recordTypes).toContain('highest_elevation');
      expect(recordTypes).toContain('best_average_speed');
    });

    it('should fetch correct records for Swim sport', async () => {
      server.use(
        graphql.query('PersonalRecords', ({ variables }) => {
          const sportType = variables.sportType as SportType;
          return HttpResponse.json({
            data: { personalRecords: MOCK_PERSONAL_RECORDS[sportType] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Swim }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.records.length).toBe(2);
      const recordTypes = result.current.records.map(r => r.type);
      expect(recordTypes).toContain('best_pace_1k');
    });
  });

  describe('Skip behavior', () => {
    it('should not fetch when skip is true', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('PersonalRecords', () => {
          querySpy();
          return HttpResponse.json({
            data: { personalRecords: MOCK_PERSONAL_RECORDS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run, skip: true }), {
        wrapper: createWrapper(),
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(querySpy).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.records).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.query('PersonalRecords', () => HttpResponse.error()));

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.records).toEqual([]);
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.query('PersonalRecords', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Unauthorized',
                extensions: { code: 'UNAUTHENTICATED' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Refetch', () => {
    it('should refetch data when refetch is called', async () => {
      const querySpy = vi.fn();

      server.use(
        graphql.query('PersonalRecords', () => {
          querySpy();
          return HttpResponse.json({
            data: { personalRecords: MOCK_PERSONAL_RECORDS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(querySpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(querySpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Record data structure', () => {
    it('should return records with correct structure', async () => {
      server.use(
        graphql.query('PersonalRecords', () => {
          return HttpResponse.json({
            data: { personalRecords: MOCK_PERSONAL_RECORDS[SportType.Run] },
          });
        }),
      );

      const { result } = renderHook(() => usePersonalRecords({ sportType: SportType.Run }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const record = result.current.records[0];
      expect(record).toHaveProperty('type');
      expect(record).toHaveProperty('value');
      expect(record).toHaveProperty('achievedAt');
      expect(record).toHaveProperty('activityId');
    });
  });
});
