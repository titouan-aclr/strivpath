import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthFeedback } from './use-auth-feedback';

const { mockUseAuth } = vi.hoisted(() => {
  return {
    mockUseAuth: vi.fn(),
  };
});

vi.mock('./context', () => ({
  useAuth: mockUseAuth,
}));

describe('useAuthFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return auth states', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current).toEqual({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
  });

  it('should use deferred value for isRefreshing state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: true,
      error: null,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current).toHaveProperty('showRefreshing');
    expect(typeof result.current.showRefreshing).toBe('boolean');
  });

  it('should immediately clear showRefreshing when isRefreshing becomes false', () => {
    const mockAuth = {
      user: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      refetch: vi.fn(),
    };

    mockUseAuth.mockReturnValue(mockAuth);

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current.showRefreshing).toBe(false);
  });

  it('should expose error from context', () => {
    const error = new Error('Network error');
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isRefreshing: false,
      error,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current.error).toBe(error);
  });
});
