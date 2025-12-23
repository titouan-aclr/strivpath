'use client';

import { useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@/lib/graphql';
import { ActivityDocument, ActivityDetailFragmentDoc, FetchActivityDetailsDocument } from '@/gql/graphql';
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
  detailsLoading: boolean;
  detailsLoaded: boolean;
  detailsError: Error | undefined;
  retryDetails: () => void;
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

  const [fetchDetails, { loading: loadingDetails, error: detailsError }] = useMutation(FetchActivityDetailsDocument, {
    refetchQueries: ['Activity'],
    awaitRefetchQueries: true,
  });

  const activity = useMemo(() => {
    if (!data?.activity) return null;

    return getFragmentData(ActivityDetailFragmentDoc, data.activity) as ActivityDetail;
  }, [data?.activity]);

  const shouldFetchDetails = activity && !activity.detailsFetched && isValidId;

  const retryDetails = useCallback(() => {
    if (activity && !activity.detailsFetched && isValidId) {
      void fetchDetails({
        variables: { stravaId: BigInt(stravaId) },
      });
    }
  }, [activity, fetchDetails, isValidId, stravaId]);

  useEffect(() => {
    if (shouldFetchDetails && !loadingDetails) {
      void fetchDetails({
        variables: { stravaId: BigInt(stravaId) },
      });
    }
  }, [shouldFetchDetails, loadingDetails, fetchDetails, stravaId]);

  return {
    activity,
    loading: loading || loadingDetails,
    error: error as Error | undefined,
    refetch,
    isValidId,
    detailsLoading: loadingDetails,
    detailsLoaded: activity?.detailsFetched ?? false,
    detailsError: detailsError as Error | undefined,
    retryDetails,
  };
}
