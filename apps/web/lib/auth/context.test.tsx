import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { authErrorHandlers, MOCK_USERS } from '@/mocks/handlers';
import { AuthContextProvider, useAuth } from './context';
import type { User } from '@/lib/graphql';

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

const createWrapper =
  (initialUser: User | null) =>
  ({ children }: { children: React.ReactNode }) => {
    return (
      <ApolloProvider client={testClient}>
        <AuthContextProvider initialUser={initialUser}>{children}</AuthContextProvider>
      </ApolloProvider>
    );
  };

describe('AuthContextProvider', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
    originalLocation = window.location;
    delete (window as { location?: Location }).location;
    window.location = { href: '' } as Location;
  });

  afterEach(async () => {
    window.location = originalLocation;
    await testClient.clearStore();
  });

  describe('Provider Rendering', () => {
    it('should render children with valid initialUser', () => {
      const mockUser = MOCK_USERS.john;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should render children with null initialUser and trigger auto-refetch', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.user).toBeNull();

      await waitFor(
        () => {
          expect(result.current.user).not.toBeNull();
        },
        { timeout: 3000 },
      );

      expect(result.current.user?.id).toBeDefined();
    });

    it('should provide all required context properties', () => {
      const mockUser = MOCK_USERS.john;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('isRefreshing');
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useAuth Hook Validation', () => {
    it('should throw error when used outside AuthContextProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthContextProvider');
    });

    it('should return context value when used inside provider', () => {
      const mockUser = MOCK_USERS.john;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      expect(result.current).toBeDefined();
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('Auto-refetch on Mount', () => {
    it('should set correct user data after auto-refetch completes', async () => {
      const mockUser = MOCK_USERS.john;

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...mockUser,
              },
            },
          });
        }),
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.user).toBeNull();

      await waitFor(
        () => {
          expect(result.current.user).not.toBeNull();
        },
        { timeout: 3000 },
      );

      expect(result.current.user?.id).toBe(mockUser.id);
      expect(result.current.user?.username).toBe(mockUser.username);
    });

    it('should not trigger refetch when initialUser is provided', async () => {
      const mockUser = MOCK_USERS.john;
      const querySpy = vi.fn();

      server.use(
        graphql.query('CurrentUser', () => {
          querySpy();
          return HttpResponse.json({
            data: { currentUser: { __typename: 'User', ...mockUser } },
          });
        }),
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(querySpy).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should redirect to login on auto-refetch failure', async () => {
      server.use(authErrorHandlers.unauthenticated);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(
        () => {
          expect(window.location.href).toBe('/login?error=session_expired');
        },
        { timeout: 3000 },
      );
    });

    it('should update user state on successful auto-refetch', async () => {
      const mockUser = MOCK_USERS.jane;

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...mockUser,
              },
            },
          });
        }),
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(null),
      });

      await waitFor(
        () => {
          expect(result.current.user).not.toBeNull();
        },
        { timeout: 3000 },
      );

      expect(result.current.user?.username).toBe(mockUser.username);
      expect(result.current.user?.firstname).toBe(mockUser.firstname);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Manual Refetch Function', () => {
    it('should update loading states during refetch', async () => {
      const mockUser = MOCK_USERS.john;

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...mockUser,
              },
            },
          });
        }),
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(false);

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isRefreshing).toBe(false);
      });

      expect(result.current.user).not.toBeNull();
    });

    it('should update user on successful refetch', async () => {
      const initialUser = MOCK_USERS.john;
      const updatedUser = MOCK_USERS.jane;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(initialUser),
      });

      expect(result.current.user?.id).toBe(initialUser.id);

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...updatedUser,
              },
            },
          });
        }),
      );

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.user?.id).toBe(updatedUser.id);
      });

      expect(result.current.user?.username).toBe(updatedUser.username);
      expect(result.current.error).toBeNull();
    });

    it('should set error state on refetch failure', async () => {
      const mockUser = MOCK_USERS.john;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      server.use(authErrorHandlers.internalServerError);

      await expect(result.current.refetch()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should reset error state before new refetch', async () => {
      const mockUser = MOCK_USERS.john;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      server.use(authErrorHandlers.internalServerError);

      await expect(result.current.refetch()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      server.use(
        graphql.query('CurrentUser', () => {
          return HttpResponse.json({
            data: {
              currentUser: {
                __typename: 'User',
                ...mockUser,
              },
            },
          });
        }),
      );

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.user).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle UNAUTHENTICATED error gracefully', async () => {
      const mockUser = MOCK_USERS.john;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      server.use(authErrorHandlers.unauthenticated);

      await expect(result.current.refetch()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should handle network errors with proper error state', async () => {
      const mockUser = MOCK_USERS.john;

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(mockUser),
      });

      server.use(authErrorHandlers.networkError);

      await expect(result.current.refetch()).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isRefreshing).toBe(false);
    });
  });
});
