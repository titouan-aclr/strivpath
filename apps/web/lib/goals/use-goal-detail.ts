'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@/lib/graphql';
import {
  GoalDocument,
  GoalDetailFragmentDoc,
  RefreshGoalProgressDocument,
  type GoalDetailFragment,
} from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';

interface UseGoalDetailOptions {
  id: number;
}

interface UseGoalDetailResult {
  goal: GoalDetailFragment | null;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
  refreshProgress: () => Promise<void>;
  refreshing: boolean;
  refreshError: Error | undefined;
}

export function useGoalDetail({ id }: UseGoalDetailOptions): UseGoalDetailResult {
  const isValidId = useMemo(() => {
    return Number.isInteger(id) && id > 0;
  }, [id]);

  const { data, loading, error, refetch } = useQuery(GoalDocument, {
    variables: { id },
    skip: !isValidId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-and-network',
  });

  const [refreshProgressMutation, { loading: refreshing, error: refreshError }] = useMutation(
    RefreshGoalProgressDocument,
    {
      refetchQueries: ['Goal'],
      awaitRefetchQueries: true,
    },
  );

  const goal = useMemo(() => {
    if (!data?.goal) return null;
    return getFragmentData(GoalDetailFragmentDoc, data.goal);
  }, [data?.goal]);

  const refreshProgress = useCallback(async () => {
    if (!isValidId) return;
    await refreshProgressMutation({ variables: { id } });
  }, [isValidId, id, refreshProgressMutation]);

  return {
    goal,
    loading: loading || refreshing,
    error: error as Error | undefined,
    refetch,
    refreshProgress,
    refreshing,
    refreshError: refreshError as Error | undefined,
  };
}
