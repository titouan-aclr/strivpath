'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { PersonalRecordsDocument, type PersonalRecord, type SportType } from '@/gql/graphql';

export interface UsePersonalRecordsOptions {
  sportType: SportType;
  skip?: boolean;
}

export interface UsePersonalRecordsResult {
  records: PersonalRecord[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function usePersonalRecords(options: UsePersonalRecordsOptions): UsePersonalRecordsResult {
  const { sportType, skip = false } = options;

  const variables = useMemo(() => ({ sportType }), [sportType]);

  const {
    data: rawData,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(PersonalRecordsDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const records = useMemo<PersonalRecord[]>(() => rawData?.personalRecords ?? [], [rawData?.personalRecords]);

  const refetch = useCallback(async () => apolloRefetch(), [apolloRefetch]);

  return {
    records,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
