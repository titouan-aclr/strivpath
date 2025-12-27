import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphQLError } from 'graphql';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { fetchCurrentUserWithRetry } from './fetch-user';
import { AUTH_CONFIG } from './auth.config';

const { maxAttempts: MAX_RETRY_ATTEMPTS, initialDelay: INITIAL_RETRY_DELAY } = AUTH_CONFIG.retry;

const { mockQuery, mockGetClient } = vi.hoisted(() => {
  const mockQuery = vi.fn();
  const mockGetClient = vi.fn(() => ({ query: mockQuery }));
  return { mockQuery, mockGetClient };
});

vi.mock('../apollo-client', () => ({
  getClient: mockGetClient,
}));

const createMockUser = () => ({
  id: '1',
  stravaId: 12345,
  username: 'testuser',
  firstname: 'Test',
  lastname: 'User',
  profile: 'https://example.com/avatar.jpg',
  profileMedium: 'https://example.com/avatar-medium.jpg',
  city: 'Paris',
  country: 'France',
  sex: 'M' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('fetchCurrentUserWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('successful fetch', () => {
    it('should return user on first attempt', async () => {
      const mockUser = createMockUser();
      mockQuery.mockResolvedValue({
        data: { currentUser: mockUser },
      });

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return user after retry on network error', async () => {
      const mockUser = createMockUser();

      let callCount = 0;
      mockQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new TypeError('Failed to fetch'));
        }
        return Promise.resolve({ data: { currentUser: mockUser } });
      });

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return null for null currentUser', async () => {
      mockQuery.mockResolvedValue({
        data: { currentUser: null },
      });

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('network error retry', () => {
    it('should retry on network error with exponential backoff', async () => {
      let callCount = 0;
      mockQuery.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new TypeError('Network request failed'));
        }
        return Promise.resolve({ data: { currentUser: createMockUser() } });
      });

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });

      await vi.advanceTimersByTimeAsync(INITIAL_RETRY_DELAY);
      await vi.advanceTimersByTimeAsync(INITIAL_RETRY_DELAY * 2);
      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBeTruthy();
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts on network error', async () => {
      mockQuery.mockRejectedValue(new TypeError('Failed to fetch'));

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });

      for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
        await vi.advanceTimersByTimeAsync(INITIAL_RETRY_DELAY * Math.pow(2, i) + 100);
      }

      await expect(resultPromise).rejects.toThrow('Failed to fetch');
      expect(mockQuery).toHaveBeenCalledTimes(MAX_RETRY_ATTEMPTS);
    });

    it('should retry on GraphQL error without code', async () => {
      const mockUser = createMockUser();

      let callCount = 0;
      mockQuery.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const graphQLError = new GraphQLError('Unknown error');
          return Promise.reject(
            new CombinedGraphQLErrors({
              errors: [graphQLError],
            }),
          );
        }
        return Promise.resolve({ data: { currentUser: mockUser } });
      });

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('authentication error', () => {
    it('should immediately return null on UNAUTHENTICATED error without retry', async () => {
      const graphQLError = new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
      const authError = new CombinedGraphQLErrors({
        errors: [graphQLError],
      });

      mockQuery.mockRejectedValue(authError);

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });

      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should not retry on authentication error and return null', async () => {
      const graphQLError = new GraphQLError('UNAUTHENTICATED: Token expired');
      const authError = new CombinedGraphQLErrors({
        errors: [graphQLError],
      });

      mockQuery.mockRejectedValue(authError);

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });
      await vi.runAllTimersAsync();

      const result = await resultPromise;
      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('other errors', () => {
    it('should throw immediately on non-network non-auth errors', async () => {
      const graphQLError = new GraphQLError('Internal server error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
      const serverError = new CombinedGraphQLErrors({
        errors: [graphQLError],
      });

      mockQuery.mockRejectedValue(serverError);

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });
      await vi.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw on unexpected error types', async () => {
      const unexpectedError = new Error('Unexpected error');

      mockQuery.mockRejectedValue(unexpectedError);

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });
      await vi.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow('Unexpected error');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('exponential backoff timing', () => {
    it('should use correct delays between retries', async () => {
      const delays: number[] = [];
      let lastTime = 0;

      mockQuery.mockImplementation(() => {
        const currentTime = Date.now();
        if (lastTime > 0) {
          delays.push(currentTime - lastTime);
        }
        lastTime = currentTime;
        throw new TypeError('Network error');
      });

      const resultPromise = fetchCurrentUserWithRetry({ headers: { cookie: '' } });

      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(INITIAL_RETRY_DELAY);
      await vi.advanceTimersByTimeAsync(INITIAL_RETRY_DELAY * 2);

      await expect(resultPromise).rejects.toThrow();

      expect(delays).toHaveLength(2);
      expect(delays[0]).toBeGreaterThanOrEqual(INITIAL_RETRY_DELAY);
      expect(delays[1]).toBeGreaterThanOrEqual(INITIAL_RETRY_DELAY * 2);
    });
  });
});
