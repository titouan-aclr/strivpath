export { graphql, type DocumentType } from '@/gql';
export { getFragmentData, type FragmentType } from '@/gql/fragment-masking';

export type {
  User,
  Activity,
  UserPreferences,
  SyncHistory,
  AuthResponse,
  Goal,
  GoalTemplate,
  CreateGoalInput,
  UpdateGoalInput,
  CreateGoalFromTemplateInput,
  GoalCardFragment,
  GoalDetailFragment,
  GoalTemplateInfoFragment,
} from '@/gql/graphql';

export {
  SportType,
  ThemeType,
  LocaleType,
  SyncStatus,
  SyncStage,
  GoalStatus,
  GoalPeriodType,
  GoalTargetType,
} from '@/gql/graphql';

export { useSuspenseQuery, useQuery, useMutation, useFragment } from '@apollo/client/react';

export type { QueryHookOptions, MutationHookOptions, SuspenseQueryHookOptions } from '@apollo/client/react';
