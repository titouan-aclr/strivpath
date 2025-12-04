'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@/lib/graphql';
import { ActivitiesDocument, type ActivityCardFragment } from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';
import { ActivityCardFragmentDoc } from '@/gql/graphql';
import { ACTIVITIES_PAGE_SIZE } from './constants';
import type { ActivityFilter } from './types';

interface UseActivitiesParams {
  filter?: ActivityFilter;
}

interface UseActivitiesResult {
  activities: ActivityCardFragment[];
  loading: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useActivities(params?: UseActivitiesParams): UseActivitiesResult {
  const [currentOffset, setCurrentOffset] = useState(0);

  const {
    data,
    loading,
    error,
    fetchMore,
    refetch: apolloRefetch,
  } = useQuery(ActivitiesDocument, {
    variables: {
      filter: {
        offset: 0,
        limit: ACTIVITIES_PAGE_SIZE,
        type: params?.filter?.type,
        startDate: params?.filter?.startDate,
        endDate: params?.filter?.endDate,
        orderBy: params?.filter?.orderBy,
        orderDirection: params?.filter?.orderDirection,
      },
    },
    notifyOnNetworkStatusChange: true,
  });

  const activities = (data?.activities ?? []).map(activity => getFragmentData(ActivityCardFragmentDoc, activity));

  const hasMore = useMemo(() => {
    const activitiesCount = activities.length;
    return activitiesCount >= currentOffset + ACTIVITIES_PAGE_SIZE;
  }, [activities.length, currentOffset]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !fetchMore) return;

    const nextOffset = currentOffset + ACTIVITIES_PAGE_SIZE;

    await fetchMore({
      variables: {
        filter: {
          type: params?.filter?.type,
          startDate: params?.filter?.startDate,
          endDate: params?.filter?.endDate,
          orderBy: params?.filter?.orderBy,
          orderDirection: params?.filter?.orderDirection,
          offset: nextOffset,
          limit: ACTIVITIES_PAGE_SIZE,
        },
      },
    });

    setCurrentOffset(nextOffset);
  }, [
    hasMore,
    loading,
    fetchMore,
    currentOffset,
    params?.filter?.type,
    params?.filter?.startDate,
    params?.filter?.endDate,
    params?.filter?.orderBy,
    params?.filter?.orderDirection,
  ]);

  const refetch = useCallback(async () => {
    setCurrentOffset(0);
    await apolloRefetch({
      filter: {
        type: params?.filter?.type,
        startDate: params?.filter?.startDate,
        endDate: params?.filter?.endDate,
        orderBy: params?.filter?.orderBy,
        orderDirection: params?.filter?.orderDirection,
        offset: 0,
        limit: ACTIVITIES_PAGE_SIZE,
      },
    });
  }, [
    apolloRefetch,
    params?.filter?.type,
    params?.filter?.startDate,
    params?.filter?.endDate,
    params?.filter?.orderBy,
    params?.filter?.orderDirection,
  ]);

  useEffect(() => {
    setCurrentOffset(0);
  }, [
    params?.filter?.type,
    params?.filter?.startDate,
    params?.filter?.endDate,
    params?.filter?.orderBy,
    params?.filter?.orderDirection,
  ]);

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
