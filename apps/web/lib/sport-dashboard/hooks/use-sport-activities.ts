'use client';

import { useMemo, useCallback } from 'react';
import { type ActivityCardFragment, type SportType } from '@/gql/graphql';
import { useActivities } from '@/lib/activities/use-activities';
import { getPrimaryActivityType } from '@/lib/sports/config';

const DEFAULT_ACTIVITY_LIMIT = 5;

export interface UseSportActivitiesOptions {
  sportType: SportType;
  limit?: number;
}

export interface UseSportActivitiesResult {
  activities: ActivityCardFragment[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

export function useSportActivities(options: UseSportActivitiesOptions): UseSportActivitiesResult {
  const { sportType, limit = DEFAULT_ACTIVITY_LIMIT } = options;

  const activityType = useMemo(() => getPrimaryActivityType(sportType), [sportType]);

  const filter = useMemo(() => ({ type: activityType }), [activityType]);

  const { activities: allActivities, loading, error, refetch } = useActivities({ filter });

  const activities = useMemo<ActivityCardFragment[]>(() => allActivities.slice(0, limit), [allActivities, limit]);

  const wrappedRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    activities,
    loading,
    error: error as Error | undefined,
    refetch: wrappedRefetch,
  };
}
