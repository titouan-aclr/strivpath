import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { GraphQLError } from 'graphql';
import { useAuthToast } from './use-auth-toast';
import { AUTH_TOAST_IDS } from './constants';

const { mockToastError, mockUseAuth, mockUseTranslations } = vi.hoisted(() => {
  return {
    mockToastError: vi.fn(),
    mockUseAuth: vi.fn(),
    mockUseTranslations: vi.fn(() => (key: string) => key),
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

vi.mock('./context', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('next-intl', () => ({
  useTranslations: mockUseTranslations,
}));

describe('useAuthToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not show toast when no error', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      refetch: vi.fn(),
    });

    renderHook(() => useAuthToast());

    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('should show network error toast with correct ID', () => {
    const networkError = new TypeError('Failed to fetch');
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: networkError,
      refetch: vi.fn(),
    });

    renderHook(() => useAuthToast());

    expect(mockToastError).toHaveBeenCalledWith(
      'networkError',
      expect.objectContaining({
        id: AUTH_TOAST_IDS.NETWORK_ERROR,
        duration: 5000,
      }),
    );
  });

  it('should not spam toasts for same error reference', () => {
    const networkError = new TypeError('Failed to fetch');
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: networkError,
      refetch: vi.fn(),
    });

    const { rerender } = renderHook(() => useAuthToast());

    expect(mockToastError).toHaveBeenCalledTimes(1);

    rerender();

    expect(mockToastError).toHaveBeenCalledTimes(1);
  });

  it('should show new toast when error reference changes', () => {
    const error1 = new TypeError('Failed to fetch');
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: error1,
      refetch: vi.fn(),
    });

    const { rerender } = renderHook(() => useAuthToast());

    expect(mockToastError).toHaveBeenCalledTimes(1);

    const error2 = new TypeError('Network timeout');
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: error2,
      refetch: vi.fn(),
    });

    rerender();

    expect(mockToastError).toHaveBeenCalledTimes(2);
    expect(mockToastError.mock.calls[0][1]).toMatchObject({
      id: AUTH_TOAST_IDS.NETWORK_ERROR,
    });
    expect(mockToastError.mock.calls[1][1]).toMatchObject({
      id: AUTH_TOAST_IDS.NETWORK_ERROR,
    });
  });

  it('should reset previous error when error becomes null', () => {
    const networkError = new TypeError('Failed to fetch');
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: networkError,
      refetch: vi.fn(),
    });

    const { rerender } = renderHook(() => useAuthToast());

    expect(mockToastError).toHaveBeenCalledTimes(1);

    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      refetch: vi.fn(),
    });

    rerender();

    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: networkError,
      refetch: vi.fn(),
    });

    rerender();

    expect(mockToastError).toHaveBeenCalledTimes(2);
  });

  it('should show auth error toast with infinite duration', () => {
    const graphQLError = new GraphQLError('Unauthorized', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
    const authError = new CombinedGraphQLErrors({
      errors: [graphQLError],
    });

    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: authError,
      refetch: vi.fn(),
    });

    renderHook(() => useAuthToast());

    expect(mockToastError).toHaveBeenCalledWith(
      'authFailed',
      expect.objectContaining({
        id: AUTH_TOAST_IDS.AUTH_ERROR,
        duration: Infinity,
      }),
    );
  });
});
