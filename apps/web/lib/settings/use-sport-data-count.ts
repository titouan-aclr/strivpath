'use client';

import { useMemo } from 'react';
import { useQuery, SportType } from '@/lib/graphql';
import { SportDataCountDocument, type SportDataCount } from '@/gql/graphql';

interface UseSportDataCountResult {
  data: SportDataCount | null;
  loading: boolean;
  error: Error | undefined;
}

export function useSportDataCount(sport: SportType | null): UseSportDataCountResult {
  const { data, loading, error } = useQuery(SportDataCountDocument, {
    variables: { sport: sport! },
    skip: !sport,
    fetchPolicy: 'network-only',
  });

  const sportDataCount = useMemo(() => {
    return data?.sportDataCount ?? null;
  }, [data?.sportDataCount]);

  return {
    data: sportDataCount,
    loading,
    error: error as Error | undefined,
  };
}
