import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ErrorLink } from '@apollo/client/link/error';
import { server } from '@/mocks/server';
import { graphql, HttpResponse } from 'msw';
import { MOCK_USER_PREFERENCES } from '@/mocks/fixtures/settings.fixture';
import { settingsErrorHandlers } from '@/mocks/handlers';
import { SportType } from '@/gql/graphql';
import {
  useAddSport,
  useRemoveSport,
  useCompleteOnboarding,
  useDeleteUserData,
  useDeleteAccount,
} from './use-settings-mutations';

const { mockRouterPush, mockRouterRefresh, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockRouterRefresh: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
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
    cache: new InMemoryCache({
      typePolicies: {
        UserPreferences: {
          keyFields: ['id'],
        },
      },
    }),
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

describe('useAddSport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAddSport(), {
      wrapper: createWrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.addSport).toBe('function');
  });

  it('should add sport successfully', async () => {
    server.use(
      graphql.mutation('AddSportToPreferences', () => {
        return HttpResponse.json({
          data: {
            addSportToPreferences: {
              ...MOCK_USER_PREFERENCES.default,
              selectedSports: [...MOCK_USER_PREFERENCES.default.selectedSports, SportType.Swim],
            },
          },
        });
      }),
    );

    const { result } = renderHook(() => useAddSport(), {
      wrapper: createWrapper,
    });

    let addResult: unknown;
    await act(async () => {
      addResult = await result.current.addSport(SportType.Swim);
    });

    expect(addResult).not.toBeNull();
    expect(mockToastSuccess).toHaveBeenCalledWith('sports.addSuccess');
    expect(result.current.error).toBeUndefined();
  });

  it('should handle add sport error', async () => {
    server.use(settingsErrorHandlers.addSportFailed);

    const { result } = renderHook(() => useAddSport(), {
      wrapper: createWrapper,
    });

    let addResult: unknown;
    await act(async () => {
      addResult = await result.current.addSport(SportType.Swim);
    });

    expect(addResult).toBeNull();
    expect(mockToastError).toHaveBeenCalledWith('sports.addError');
    expect(result.current.error).toBeDefined();
  });
});

describe('useRemoveSport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useRemoveSport(), {
      wrapper: createWrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.removeSport).toBe('function');
  });

  it('should remove sport successfully', async () => {
    server.use(
      graphql.mutation('RemoveSportFromPreferences', () => {
        return HttpResponse.json({
          data: { removeSportFromPreferences: true },
        });
      }),
    );

    const { result } = renderHook(() => useRemoveSport(), {
      wrapper: createWrapper,
    });

    let removeResult: boolean = false;
    await act(async () => {
      removeResult = await result.current.removeSport(SportType.Ride, false);
    });

    expect(removeResult).toBe(true);
    expect(mockToastSuccess).toHaveBeenCalledWith('sports.removeSuccess');
    expect(result.current.error).toBeUndefined();
  });

  it('should remove sport with data deletion', async () => {
    const spy = vi.fn();

    server.use(
      graphql.mutation('RemoveSportFromPreferences', ({ variables }) => {
        spy(variables);
        return HttpResponse.json({
          data: { removeSportFromPreferences: true },
        });
      }),
    );

    const { result } = renderHook(() => useRemoveSport(), {
      wrapper: createWrapper,
    });

    await act(async () => {
      await result.current.removeSport(SportType.Ride, true);
    });

    expect(spy).toHaveBeenCalledWith({ sport: SportType.Ride, deleteData: true });
  });

  it('should handle remove sport error', async () => {
    server.use(settingsErrorHandlers.removeSportFailed);

    const { result } = renderHook(() => useRemoveSport(), {
      wrapper: createWrapper,
    });

    let removeResult: boolean = true;
    await act(async () => {
      removeResult = await result.current.removeSport(SportType.Ride, false);
    });

    expect(removeResult).toBe(false);
    expect(mockToastError).toHaveBeenCalledWith('sports.removeError');
    expect(result.current.error).toBeDefined();
  });
});

describe('useCompleteOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should complete onboarding successfully', async () => {
    server.use(
      graphql.mutation('CompleteOnboarding', () => {
        return HttpResponse.json({
          data: {
            completeOnboarding: {
              ...MOCK_USER_PREFERENCES.default,
              onboardingCompleted: true,
            },
          },
        });
      }),
    );

    const { result } = renderHook(() => useCompleteOnboarding(), {
      wrapper: createWrapper,
    });

    let completeResult: unknown;
    await act(async () => {
      completeResult = await result.current.completeOnboarding();
    });

    expect(completeResult).not.toBeNull();
    expect(result.current.error).toBeUndefined();
  });
});

describe('useDeleteUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useDeleteUserData(), {
      wrapper: createWrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.deleteUserData).toBe('function');
  });

  it('should delete user data successfully', async () => {
    server.use(
      graphql.mutation('DeleteUserData', () => {
        return HttpResponse.json({
          data: { deleteUserData: true },
        });
      }),
    );

    const { result } = renderHook(() => useDeleteUserData(), {
      wrapper: createWrapper,
    });

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteUserData();
    });

    expect(deleteResult).toBe(true);
    expect(mockToastSuccess).toHaveBeenCalledWith('dangerZone.deleteData.success');
    expect(result.current.error).toBeUndefined();
  });

  it('should handle delete user data error', async () => {
    server.use(settingsErrorHandlers.deleteUserDataFailed);

    const { result } = renderHook(() => useDeleteUserData(), {
      wrapper: createWrapper,
    });

    let deleteResult: boolean = true;
    await act(async () => {
      deleteResult = await result.current.deleteUserData();
    });

    expect(deleteResult).toBe(false);
    expect(mockToastError).toHaveBeenCalledWith('dangerZone.deleteData.error');
    expect(result.current.error).toBeDefined();
  });
});

describe('useDeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testClient = createTestApolloClient();
  });

  afterEach(async () => {
    await testClient.clearStore();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.deleteAccount).toBe('function');
  });

  it('should delete account successfully and redirect', async () => {
    server.use(
      graphql.mutation('DeleteAccount', () => {
        return HttpResponse.json({
          data: { deleteAccount: true },
        });
      }),
    );

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper,
    });

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteAccount();
    });

    expect(deleteResult).toBe(true);
    expect(mockToastSuccess).toHaveBeenCalledWith('dangerZone.deleteAccount.success');
    expect(mockRouterPush).toHaveBeenCalledWith('/login');
    expect(mockRouterRefresh).toHaveBeenCalled();
    expect(result.current.error).toBeUndefined();
  });

  it('should handle delete account error', async () => {
    server.use(settingsErrorHandlers.deleteAccountFailed);

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper,
    });

    let deleteResult: boolean = true;
    await act(async () => {
      deleteResult = await result.current.deleteAccount();
    });

    expect(deleteResult).toBe(false);
    expect(mockToastError).toHaveBeenCalledWith('dangerZone.deleteAccount.error');
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(result.current.error).toBeDefined();
  });

  it('should reset loading state after completion', async () => {
    server.use(
      graphql.mutation('DeleteAccount', () => {
        return HttpResponse.json({
          data: { deleteAccount: true },
        });
      }),
    );

    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper,
    });

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.deleteAccount();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
