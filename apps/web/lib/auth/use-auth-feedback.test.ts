import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthFeedback } from './use-auth-feedback';

const { mockUseRefreshState } = vi.hoisted(() => {
  return {
    mockUseRefreshState: vi.fn(),
  };
});

vi.mock('./use-refresh-state', () => ({
  useRefreshState: mockUseRefreshState,
}));

describe('useAuthFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return auth states', () => {
    mockUseRefreshState.mockReturnValue({
      isRefreshing: false,
      setRefreshing: vi.fn(),
      reset: vi.fn(),
    });

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current).toEqual({
      isLoading: false,
      showRefreshing: false,
      error: null,
    });
  });

  it('should use isRefreshing from refresh state', () => {
    mockUseRefreshState.mockReturnValue({
      isRefreshing: true,
      setRefreshing: vi.fn(),
      reset: vi.fn(),
    });

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current).toHaveProperty('showRefreshing');
    expect(result.current.showRefreshing).toBe(true);
  });

  it('should clear showRefreshing when isRefreshing becomes false', () => {
    mockUseRefreshState.mockReturnValue({
      isRefreshing: false,
      setRefreshing: vi.fn(),
      reset: vi.fn(),
    });

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current.showRefreshing).toBe(false);
  });

  it('should return null for error', () => {
    mockUseRefreshState.mockReturnValue({
      isRefreshing: false,
      setRefreshing: vi.fn(),
      reset: vi.fn(),
    });

    const { result } = renderHook(() => useAuthFeedback());

    expect(result.current.error).toBe(null);
  });
});
