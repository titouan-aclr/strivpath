'use client';

import { useDeferredValue } from 'react';
import { useAuth } from './context';

export function useAuthFeedback() {
  const { isLoading, isRefreshing, error } = useAuth();

  const deferredIsRefreshing = useDeferredValue(isRefreshing);

  return {
    isLoading,
    showRefreshing: deferredIsRefreshing,
    error,
  };
}
