import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurrentUser } from './use-current-user';
import { AUTH_CONFIG } from './auth.config';

const mockUser = {
  id: '1',
  username: 'testuser',
  firstname: 'Test',
  lastname: 'User',
  stravaId: 12345,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const { mockUseQuery, mockGetFragmentData, mockRedirectToLogin } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockGetFragmentData: vi.fn(),
  mockRedirectToLogin: vi.fn(),
}));

vi.mock('@/lib/graphql', () => ({
  useQuery: mockUseQuery,
  getFragmentData: mockGetFragmentData,
}));

vi.mock('./redirect-to-login', () => ({
  redirectToLogin: mockRedirectToLogin,
}));

vi.mock('./auth.config', () => ({
  AUTH_CONFIG: {
    redirectReasons: {
      sessionExpired: 'session_expired',
    },
  },
}));

vi.mock('@/gql/graphql', () => ({
  CurrentUserDocument: { kind: 'Document' },
  UserFullInfoFragmentDoc: { kind: 'Document' },
}));

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial User Provided', () => {
    it('should return initialUser when provided', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useCurrentUser(mockUser));

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should skip GraphQL query when initialUser is provided', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error: null,
      });

      renderHook(() => useCurrentUser(mockUser));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: true,
          errorPolicy: 'all',
          fetchPolicy: 'cache-first',
        }),
      );
    });

    it('should not redirect when initialUser is provided even if there is an error', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Some error'),
      });

      renderHook(() => useCurrentUser(mockUser));

      expect(mockRedirectToLogin).not.toHaveBeenCalled();
    });
  });

  describe('Fetching User from GraphQL', () => {
    it('should fetch user when no initialUser is provided', () => {
      const queryUser = { ...mockUser, id: '2' };
      mockUseQuery.mockReturnValue({
        data: {
          currentUser: queryUser,
        },
        loading: false,
        error: null,
      });
      mockGetFragmentData.mockReturnValue(queryUser);

      const { result } = renderHook(() => useCurrentUser(null));

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skip: false,
        }),
      );
      expect(result.current.user).toEqual(queryUser);
    });

    it('should return loading state while fetching', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useCurrentUser(null));

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('should return null when query returns null user', () => {
      mockUseQuery.mockReturnValue({
        data: {
          currentUser: null,
        },
        loading: false,
        error: null,
      });
      mockGetFragmentData.mockReturnValue(null);

      const { result } = renderHook(() => useCurrentUser(null));

      expect(result.current.user).toBeNull();
    });

    it('should validate user type and return null for invalid user', () => {
      const invalidUser = {
        id: 123,
        username: 'testuser',
      };

      mockUseQuery.mockReturnValue({
        data: {
          currentUser: invalidUser,
        },
        loading: false,
        error: null,
      });
      mockGetFragmentData.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useCurrentUser(null));

      expect(result.current.user).toBeNull();
    });
  });

  describe('Error Handling and Redirect', () => {
    it('should redirect to login on error when loading is false and no user', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('UNAUTHENTICATED'),
      });

      renderHook(() => useCurrentUser(null));

      await waitFor(() => {
        expect(mockRedirectToLogin).toHaveBeenCalledWith(AUTH_CONFIG.redirectReasons.sessionExpired);
      });
    });

    it('should not redirect on error when still loading', () => {
      mockUseQuery.mockReturnValue({
        data: null,
        loading: true,
        error: new Error('UNAUTHENTICATED'),
      });

      renderHook(() => useCurrentUser(null));

      expect(mockRedirectToLogin).not.toHaveBeenCalled();
    });

    it('should not redirect on error when user exists', () => {
      mockUseQuery.mockReturnValue({
        data: {
          currentUser: mockUser,
        },
        loading: false,
        error: new Error('Some error'),
      });
      mockGetFragmentData.mockReturnValue(mockUser);

      renderHook(() => useCurrentUser(null));

      expect(mockRedirectToLogin).not.toHaveBeenCalled();
    });

    it('should return error in result', () => {
      const error = new Error('Network error');
      mockUseQuery.mockReturnValue({
        data: null,
        loading: false,
        error,
      });

      const { result } = renderHook(() => useCurrentUser(null));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Type Validation', () => {
    it('should reject user without string id', () => {
      const invalidUser = {
        id: null,
        username: 'testuser',
      };

      mockUseQuery.mockReturnValue({
        data: {
          currentUser: invalidUser,
        },
        loading: false,
        error: null,
      });
      mockGetFragmentData.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useCurrentUser(null));

      expect(result.current.user).toBeNull();
    });

    it('should reject user without string username', () => {
      const invalidUser = {
        id: '1',
        username: null,
      };

      mockUseQuery.mockReturnValue({
        data: {
          currentUser: invalidUser,
        },
        loading: false,
        error: null,
      });
      mockGetFragmentData.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useCurrentUser(null));

      expect(result.current.user).toBeNull();
    });
  });
});
