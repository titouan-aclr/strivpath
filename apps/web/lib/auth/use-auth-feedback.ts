'use client';

import { useRefreshState } from './use-refresh-state';

export function useAuthFeedback() {
  const { isRefreshing } = useRefreshState();

  return {
    isLoading: false,
    showRefreshing: isRefreshing,
    error: null,
  };
}
