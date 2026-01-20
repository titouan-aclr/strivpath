'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, type SyncHistory } from '@/lib/graphql';
import { LatestSyncHistoryDocument } from '@/gql/graphql';

interface UseLatestSyncHistoryResult {
  syncHistory: SyncHistory | null;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useLatestSyncHistory(): UseLatestSyncHistoryResult {
  const {
    data,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(LatestSyncHistoryDocument, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const syncHistory = useMemo(() => {
    return (data?.latestSyncHistory as SyncHistory | null) ?? null;
  }, [data?.latestSyncHistory]);

  const refetch = useCallback(async () => {
    return apolloRefetch();
  }, [apolloRefetch]);

  return {
    syncHistory,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
