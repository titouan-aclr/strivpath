'use client';

import { useMemo } from 'react';
import { useQuery } from '@/lib/graphql';
import { ActivityDocument, ActivityDetailFragmentDoc } from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';
import type { ActivityDetail } from './activity-types';

interface UseActivityDetailOptions {
  stravaId: string;
}

interface UseActivityDetailResult {
  activity: ActivityDetail | null;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
  isValidId: boolean;
}

export function useActivityDetail({ stravaId }: UseActivityDetailOptions): UseActivityDetailResult {
  const isValidId = useMemo(() => {
    try {
      const id = BigInt(stravaId);
      return Number(id) > 0 && Number.isInteger(Number(id));
    } catch {
      return false;
    }
  }, [stravaId]);

  const { data, loading, error, refetch } = useQuery(ActivityDocument, {
    variables: { stravaId },
    skip: !isValidId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-and-network',
  });

  const activity = useMemo(() => {
    if (!data?.activity) return null;

    return getFragmentData(ActivityDetailFragmentDoc, data.activity) as ActivityDetail;
  }, [data?.activity]);

  return {
    activity,
    loading,
    error: error as Error | undefined,
    refetch,
    isValidId,
  };
}
