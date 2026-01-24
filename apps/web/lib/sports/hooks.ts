'use client';

import { useMemo } from 'react';
import { useUserPreferences } from '@/lib/settings/use-user-preferences';
import { getFilteredSportConfigs, type SportConfig } from './config';
import type { SportType } from '@/gql/graphql';

export interface UseAvailableSportsResult {
  availableSports: SportType[];
  sportConfigs: SportConfig[];
  loading: boolean;
}

export function useAvailableSports(): UseAvailableSportsResult {
  const { preferences, loading } = useUserPreferences();

  const availableSports = preferences?.selectedSports ?? [];

  const sportConfigs = useMemo(() => getFilteredSportConfigs(availableSports), [availableSports]);

  return { availableSports, sportConfigs, loading };
}
