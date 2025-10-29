export { graphql, type DocumentType } from '@/gql';
export { getFragmentData, type FragmentType } from '@/gql/fragment-masking';

export type { User, Activity, UserPreferences, SyncHistory, AuthResponse } from '@repo/graphql-types';

export { SportType, ThemeType, LocaleType, SyncStatus, SyncStage } from '@repo/graphql-types';

export { useSuspenseQuery, useQuery, useMutation, useFragment } from '@apollo/client/react';

export type { QueryHookOptions, MutationHookOptions, SuspenseQueryHookOptions } from '@apollo/client/react';
