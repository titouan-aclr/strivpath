import { GoalTargetType } from '@/gql/graphql';

export const GOAL_TARGET_LIMITS = {
  [GoalTargetType.Distance]: 10000,
  [GoalTargetType.Duration]: 1000,
  [GoalTargetType.Frequency]: 365,
  [GoalTargetType.Elevation]: 100000,
} as const;

export const GOAL_TITLE_MAX_LENGTH = 100;
