'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@/lib/graphql';
import {
  UserPreferencesDocument,
  UserPreferencesInfoFragmentDoc,
  type UserPreferencesInfoFragment,
} from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';

interface UseUserPreferencesResult {
  preferences: UserPreferencesInfoFragment | null;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useUserPreferences(): UseUserPreferencesResult {
  const {
    data,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(UserPreferencesDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-and-network',
  });

  const preferences = useMemo(() => {
    if (!data?.userPreferences) return null;
    return getFragmentData(UserPreferencesInfoFragmentDoc, data.userPreferences);
  }, [data?.userPreferences]);

  const refetch = useCallback(async () => {
    return apolloRefetch();
  }, [apolloRefetch]);

  return {
    preferences,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
