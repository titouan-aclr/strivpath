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
  const [accumulatedActivities, setAccumulatedActivities] = useState<ActivityCardFragment[]>([]);

  const startDateString = useMemo(
    () => params?.filter?.startDate?.toISOString(),
    [params?.filter?.startDate?.getTime()],
  );
  const endDateString = useMemo(() => params?.filter?.endDate?.toISOString(), [params?.filter?.endDate?.getTime()]);

  const queryVariables = useMemo(
    () => ({
      filter: {
        offset: currentOffset,
        limit: ACTIVITIES_PAGE_SIZE,
        type: params?.filter?.type,
        startDate: startDateString as unknown as Date | undefined,
        endDate: endDateString as unknown as Date | undefined,
        orderBy: params?.filter?.orderBy,
        orderDirection: params?.filter?.orderDirection,
      },
    }),
    [
      currentOffset,
      params?.filter?.type,
      startDateString,
      endDateString,
      params?.filter?.orderBy,
      params?.filter?.orderDirection,
    ],
  );

  const {
    data,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(ActivitiesDocument, {
    variables: queryVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache',
  });

  useEffect(() => {
    if (data?.activities) {
      const newActivities = data.activities.map(activity => getFragmentData(ActivityCardFragmentDoc, activity));

      if (currentOffset === 0) {
        setAccumulatedActivities(newActivities);
      } else {
        setAccumulatedActivities(prev => {
          const combined = [...prev, ...newActivities];
          const unique = combined.filter(
            (activity, index, self) =>
              index === self.findIndex(a => a.stravaId.toString() === activity.stravaId.toString()),
          );
          return unique;
        });
      }
    }
  }, [data?.activities, currentOffset]);

  useEffect(() => {
    setCurrentOffset(0);
    setAccumulatedActivities([]);
  }, [params?.filter?.type, startDateString, endDateString, params?.filter?.orderBy, params?.filter?.orderDirection]);

  const hasMore = useMemo(() => {
    if (!data?.activities) return false;
    return data.activities.length === ACTIVITIES_PAGE_SIZE;
  }, [data?.activities]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return Promise.resolve();
    setCurrentOffset(prev => prev + ACTIVITIES_PAGE_SIZE);
    return Promise.resolve();
  }, [hasMore, loading]);

  const refetch = useCallback(async () => {
    setCurrentOffset(0);
    setAccumulatedActivities([]);
    await apolloRefetch();
  }, [apolloRefetch]);

  return {
    activities: accumulatedActivities,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
