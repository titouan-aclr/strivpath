import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_USERS } from '@/mocks/handlers';
import { SportType } from '@/gql/graphql';
import { useSportSelection } from './use-sport-selection';
import { AuthContextProvider } from '../auth/context';
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

const { mockRouterPush, mockToast, mockUseTranslations } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockToast: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockUseTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));

describe('useSportSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  describe('Initialization', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      expect(result.current.selectedSports).toEqual([]);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.canSubmit).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.toggleSport).toBeInstanceOf(Function);
      expect(result.current.handleSubmit).toBeInstanceOf(Function);
    });
  });

  describe('Toggle Sport', () => {
    it('should add sport when toggled', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.selectedSports).toEqual([SportType.Run]);
    });

    it('should remove sport when toggled again', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.selectedSports).toEqual([SportType.Run]);

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.selectedSports).toEqual([]);
    });

    it('should add multiple sports', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      act(() => {
        result.current.toggleSport(SportType.Ride);
      });

      expect(result.current.selectedSports).toEqual([SportType.Run, SportType.Ride]);
    });

    it('should allow deselecting sport when at maximum', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
        result.current.toggleSport(SportType.Ride);
        result.current.toggleSport(SportType.Swim);
      });

      expect(result.current.selectedSports).toHaveLength(3);

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.selectedSports).toHaveLength(2);
      expect(result.current.selectedSports).not.toContain(SportType.Run);
      expect(result.current.selectedSports).toContain(SportType.Ride);
      expect(result.current.selectedSports).toContain(SportType.Swim);
    });

    it('should allow removing and adding different sport when at max', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
        result.current.toggleSport(SportType.Ride);
        result.current.toggleSport(SportType.Swim);
      });

      expect(result.current.selectedSports).toHaveLength(3);

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.selectedSports).toHaveLength(2);
      expect(result.current.selectedSports).not.toContain(SportType.Run);

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.selectedSports).toHaveLength(3);
      expect(result.current.selectedSports).toContain(SportType.Run);
    });
  });

  describe('Can Submit', () => {
    it('should not allow submit with no sports selected', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it('should allow submit with at least one sport selected', () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it('should not allow submit while submitting', async () => {
      server.use(
        graphql.mutation('UpdateUserPreferences', () => {
          return new Promise(() => {});
        }),
      );

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      expect(result.current.canSubmit).toBe(true);

      act(() => {
        void result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      expect(result.current.canSubmit).toBe(false);
    });
  });

  describe('Submit - Success', () => {
    it('should successfully submit and redirect to sync page', async () => {
      const updatePreferencesSpy = vi.fn();

      server.use(
        graphql.mutation('UpdateUserPreferences', ({ variables }) => {
          updatePreferencesSpy(variables);
          const input = variables.input as { selectedSports: string[] };
          return HttpResponse.json({
            data: {
              updateUserPreferences: {
                __typename: 'UserPreferences',
                id: '1',
                userId: 1,
                selectedSports: input.selectedSports,
                locale: 'EN',
                theme: 'light',
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }),
      );

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
        result.current.toggleSport(SportType.Ride);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(updatePreferencesSpy).toHaveBeenCalledWith({
        input: {
          selectedSports: [SportType.Run, SportType.Ride],
        },
      });

      expect(mockRouterPush).toHaveBeenCalledWith('/sync');
      expect(result.current.error).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should set isSubmitting during submission', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>(resolve => {
        resolveSubmit = resolve;
      });

      server.use(
        graphql.mutation('UpdateUserPreferences', async () => {
          await submitPromise;
          return HttpResponse.json({
            data: {
              updateUserPreferences: {
                __typename: 'UserPreferences',
                id: '1',
                userId: 1,
                selectedSports: [SportType.Run],
                locale: 'EN',
                theme: 'light',
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }),
      );

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      act(() => {
        void result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      act(() => {
        resolveSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });

  describe('Submit - Validation', () => {
    it('should show error toast when submitting with no sports', async () => {
      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockToast.error).toHaveBeenCalledWith('sports.validation.minOne', {
        id: 'onboarding-save-error',
      });
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should not submit when already submitting', async () => {
      const updatePreferencesSpy = vi.fn();

      server.use(
        graphql.mutation('UpdateUserPreferences', () => {
          updatePreferencesSpy();
          return new Promise(() => {});
        }),
      );

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      act(() => {
        void result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(updatePreferencesSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Submit - Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(graphql.mutation('UpdateUserPreferences', () => HttpResponse.error()));

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('network');
      expect(mockToast.error).toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        graphql.mutation('UpdateUserPreferences', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Database error',
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).not.toBeNull();
      expect(mockToast.error).toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('should handle token expiration errors', async () => {
      server.use(
        graphql.mutation('UpdateUserPreferences', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Strava refresh token expired',
                extensions: { code: 'STRAVA_REFRESH_TOKEN_EXPIRED' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('token_expired');
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('should clear error before new submission', async () => {
      server.use(
        graphql.mutation('UpdateUserPreferences', () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Database error',
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
              },
            ],
            data: null,
          });
        }),
      );

      const { result } = renderHook(() => useSportSelection(), {
        wrapper: createWrapper(MOCK_USERS.john),
      });

      act(() => {
        result.current.toggleSport(SportType.Run);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).not.toBeNull();

      server.use(
        graphql.mutation('UpdateUserPreferences', () => {
          return HttpResponse.json({
            data: {
              updateUserPreferences: {
                __typename: 'UserPreferences',
                id: '1',
                userId: 1,
                selectedSports: [SportType.Run],
                locale: 'EN',
                theme: 'light',
                onboardingCompleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }),
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBeNull();
      expect(mockRouterPush).toHaveBeenCalledWith('/sync');
    });
  });
});
