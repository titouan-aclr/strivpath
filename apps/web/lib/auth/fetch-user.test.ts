import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCurrentUserWithRetry } from './fetch-user';

const mockUser = {
  id: '1',
  username: 'testuser',
  firstname: 'Test',
  lastname: 'User',
  stravaId: 12345,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const {
  mockGetClient,
  mockGetFragmentData,
  mockGetServerRequestContext,
  mockIsNetworkError,
  mockIsUnauthenticatedError,
} = vi.hoisted(() => ({
  mockGetClient: vi.fn(),
  mockGetFragmentData: vi.fn(),
  mockGetServerRequestContext: vi.fn(),
  mockIsNetworkError: vi.fn(),
  mockIsUnauthenticatedError: vi.fn(),
}));

vi.mock('../apollo-client', () => ({
  getClient: mockGetClient,
}));

vi.mock('@/lib/graphql', () => ({
  getFragmentData: mockGetFragmentData,
}));

vi.mock('../apollo-ssr-context', () => ({
  getServerRequestContext: mockGetServerRequestContext,
}));

vi.mock('./token-refresh-shared', () => ({
  isNetworkError: mockIsNetworkError,
  isUnauthenticatedError: mockIsUnauthenticatedError,
}));

vi.mock('@/gql/graphql', () => ({
  CurrentUserDocument: { kind: 'Document' },
  UserFullInfoFragmentDoc: { kind: 'Document' },
}));

describe('fetchCurrentUserWithRetry', () => {
  const mockApolloContext = { headers: { cookie: 'test' } };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerRequestContext.mockResolvedValue(mockApolloContext);
    mockIsNetworkError.mockReturnValue(false);
    mockIsUnauthenticatedError.mockReturnValue(false);
  });

  describe('Successful Fetch', () => {
    it('should return user on first successful attempt', async () => {
      const mockQueryResult = {
        data: {
          currentUser: mockUser,
        },
      };

      mockGetClient.mockReturnValue({
        query: vi.fn().mockResolvedValue(mockQueryResult),
      });
      mockGetFragmentData.mockReturnValue(mockUser);

      const result = await fetchCurrentUserWithRetry();

      expect(result).toEqual(mockUser);
      expect(mockGetClient().query).toHaveBeenCalledTimes(1);
      expect(mockGetClient().query).toHaveBeenCalledWith({
        query: expect.anything(),
        context: mockApolloContext,
        errorPolicy: 'none',
      });
    });

    it('should return null when user data is null', async () => {
      const mockQueryResult = {
        data: {
          currentUser: null,
        },
      };

      mockGetClient.mockReturnValue({
        query: vi.fn().mockResolvedValue(mockQueryResult),
      });
      mockGetFragmentData.mockReturnValue(null);

      const result = await fetchCurrentUserWithRetry();

      expect(result).toBeNull();
      expect(mockGetClient().query).toHaveBeenCalledTimes(1);
    });

    it('should return null when user fails type validation', async () => {
      const invalidUser = {
        id: 123,
        username: 'testuser',
      };

      const mockQueryResult = {
        data: {
          currentUser: invalidUser,
        },
      };

      mockGetClient.mockReturnValue({
        query: vi.fn().mockResolvedValue(mockQueryResult),
      });
      mockGetFragmentData.mockReturnValue(invalidUser);

      const result = await fetchCurrentUserWithRetry();

      expect(result).toBeNull();
    });

    it('should use provided context instead of fetching new one', async () => {
      const customContext = { headers: { cookie: 'custom' } };
      const mockQueryResult = {
        data: {
          currentUser: mockUser,
        },
      };

      mockGetClient.mockReturnValue({
        query: vi.fn().mockResolvedValue(mockQueryResult),
      });
      mockGetFragmentData.mockReturnValue(mockUser);

      await fetchCurrentUserWithRetry(customContext);

      expect(mockGetServerRequestContext).not.toHaveBeenCalled();
      expect(mockGetClient().query).toHaveBeenCalledWith({
        query: expect.anything(),
        context: customContext,
        errorPolicy: 'none',
      });
    });
  });

  describe('Retry Logic - Network Errors', () => {
    it('should retry on network error and succeed on second attempt', async () => {
      const mockQueryFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            currentUser: mockUser,
          },
        });

      mockGetClient.mockReturnValue({
        query: mockQueryFn,
      });
      mockGetFragmentData.mockReturnValue(mockUser);
      mockIsNetworkError.mockReturnValueOnce(true).mockReturnValueOnce(false);
      mockIsUnauthenticatedError.mockReturnValue(false);

      const result = await fetchCurrentUserWithRetry();

      expect(result).toEqual(mockUser);
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling - Unauthenticated', () => {
    it('should return null on unauthenticated error without retry', async () => {
      const authError = new Error('UNAUTHENTICATED');
      const mockQueryFn = vi.fn().mockRejectedValue(authError);

      mockGetClient.mockReturnValue({
        query: mockQueryFn,
      });
      mockIsUnauthenticatedError.mockReturnValue(true);

      const result = await fetchCurrentUserWithRetry();

      expect(result).toBeNull();
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on unauthenticated error even if max attempts not reached', async () => {
      const authError = new Error('UNAUTHENTICATED');
      const mockQueryFn = vi.fn().mockRejectedValue(authError);

      mockGetClient.mockReturnValue({
        query: mockQueryFn,
      });
      mockIsUnauthenticatedError.mockReturnValue(true);

      await fetchCurrentUserWithRetry();

      expect(mockQueryFn).toHaveBeenCalledTimes(1);
      expect(mockIsNetworkError).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling - Other Errors', () => {
    it('should throw error immediately for non-network, non-auth errors', async () => {
      const validationError = new Error('VALIDATION_ERROR');
      const mockQueryFn = vi.fn().mockRejectedValue(validationError);

      mockGetClient.mockReturnValue({
        query: mockQueryFn,
      });
      mockIsNetworkError.mockReturnValue(false);
      mockIsUnauthenticatedError.mockReturnValue(false);

      await expect(fetchCurrentUserWithRetry()).rejects.toThrow('VALIDATION_ERROR');
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Type Validation', () => {
    it('should validate user has required string id property', async () => {
      const invalidUser = {
        id: null,
        username: 'testuser',
      };

      const mockQueryResult = {
        data: {
          currentUser: invalidUser,
        },
      };

      mockGetClient.mockReturnValue({
        query: vi.fn().mockResolvedValue(mockQueryResult),
      });
      mockGetFragmentData.mockReturnValue(invalidUser);

      const result = await fetchCurrentUserWithRetry();

      expect(result).toBeNull();
    });

    it('should validate user has required string username property', async () => {
      const invalidUser = {
        id: '1',
        username: null,
      };

      const mockQueryResult = {
        data: {
          currentUser: invalidUser,
        },
      };

      mockGetClient.mockReturnValue({
        query: vi.fn().mockResolvedValue(mockQueryResult),
      });
      mockGetFragmentData.mockReturnValue(invalidUser);

      const result = await fetchCurrentUserWithRetry();

      expect(result).toBeNull();
    });
  });
});
