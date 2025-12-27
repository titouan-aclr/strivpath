'use client';

export function useAuthFeedback() {
  return {
    isLoading: false,
    showRefreshing: false,
    error: null,
  };
}
