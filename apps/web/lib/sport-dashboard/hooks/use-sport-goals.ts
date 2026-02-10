'use client';

import { useMemo } from 'react';
import { type GoalCardFragment, GoalStatus, type SportType } from '@/gql/graphql';
import { useGoals } from '@/lib/goals/use-goals';

export interface UseSportGoalsOptions {
  sportType: SportType;
}

export interface UseSportGoalsResult {
  primaryGoal: GoalCardFragment | null;
  secondaryGoals: GoalCardFragment[];
  hasGoals: boolean;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useSportGoals(options: UseSportGoalsOptions): UseSportGoalsResult {
  const { sportType } = options;

  const { goals, loading, error, refetch } = useGoals({
    sportType,
    status: GoalStatus.Active,
  });

  const primaryGoal = useMemo<GoalCardFragment | null>(() => goals[0] ?? null, [goals]);

  const secondaryGoals = useMemo<GoalCardFragment[]>(() => goals.slice(1, 3), [goals]);

  const hasGoals = goals.length > 0;

  return {
    primaryGoal,
    secondaryGoals,
    hasGoals,
    loading,
    error,
    refetch,
  };
}
