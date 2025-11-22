import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { authErrorHandlers } from '@/mocks/handlers';
import { useLogout } from './use-logout';

const { mockRouterPush, mockRouterRefresh, mockToastError } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockRouterRefresh: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

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

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  return <ApolloProvider client={testClient}>{children}</ApolloProvider>;
};

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('Successful Logout', () => {
    it('should call logout mutation and redirect on success', async () => {
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await result.current.logout();

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
        expect(mockRouterRefresh).toHaveBeenCalled();
      });

      expect(mockToastError).not.toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should reset loading state after logout completes', async () => {
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      expect(result.current.isLoading).toBe(false);

      await result.current.logout();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it('should call router methods in correct order', async () => {
      const callOrder: string[] = [];

      mockRouterPush.mockImplementationOnce(() => {
        callOrder.push('push');
      });

      mockRouterRefresh.mockImplementationOnce(() => {
        callOrder.push('refresh');
      });

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await result.current.logout();

      await waitFor(() => {
        expect(callOrder).toEqual(['push', 'refresh']);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle logout error and show toast', async () => {
      server.use(authErrorHandlers.logoutFailed);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await expect(result.current.logout()).rejects.toThrow();

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to logout', {
          description: 'Please try again or refresh the page.',
        });
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should set error state on logout failure', async () => {
      server.use(authErrorHandlers.logoutNetworkError);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await expect(result.current.logout()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBeDefined();
    });

    it('should re-throw error after handling', async () => {
      server.use(authErrorHandlers.logoutFailed);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await expect(result.current.logout()).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should convert non-Error to Error on failure', async () => {
      server.use(
        graphql.mutation('Logout', () => {
          return HttpResponse.json(
            {
              errors: [{ message: 'String error' }],
              data: null,
            },
            { status: 500 },
          );
        }),
      );

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await expect(result.current.logout()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });
    });

    it('should reset error state before new logout attempt', async () => {
      server.use(authErrorHandlers.logoutFailed);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await expect(result.current.logout()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      server.use(
        graphql.mutation('Logout', () => {
          return HttpResponse.json({
            data: {
              logout: true,
            },
          });
        }),
      );

      await result.current.logout();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle multiple sequential logout attempts', async () => {
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper,
      });

      await result.current.logout();
      await result.current.logout();
      await result.current.logout();

      expect(mockRouterPush).toHaveBeenCalledTimes(3);
      expect(mockRouterRefresh).toHaveBeenCalledTimes(3);
      expect(result.current.error).toBeNull();
    });
  });
});
