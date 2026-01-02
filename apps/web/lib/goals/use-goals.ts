'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@/lib/graphql';
import { GoalsDocument, GoalCardFragmentDoc, type GoalCardFragment, GoalStatus, SportType } from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';

export interface UseGoalsFilters {
  status?: GoalStatus;
  sportType?: SportType;
  includeArchived?: boolean;
}

interface UseGoalsResult {
  goals: GoalCardFragment[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useGoals(filters?: UseGoalsFilters): UseGoalsResult {
  const variables = useMemo(
    () => ({
      status: filters?.status,
      sportType: filters?.sportType,
      includeArchived: filters?.includeArchived ?? false,
    }),
    [filters?.status, filters?.sportType, filters?.includeArchived],
  );

  const {
    data,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(GoalsDocument, {
    variables,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const goals = useMemo(() => {
    if (!data?.goals) return [];
    return data.goals.map(goal => getFragmentData(GoalCardFragmentDoc, goal));
  }, [data?.goals]);

  const refetch = useCallback(async () => {
    return apolloRefetch();
  }, [apolloRefetch]);

  return {
    goals,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
