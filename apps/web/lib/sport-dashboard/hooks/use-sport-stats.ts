'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  SportPeriodStatisticsDocument,
  type SportPeriodStatistics,
  type SportType,
  StatisticsPeriod,
} from '@/gql/graphql';

export interface UseSportStatsOptions {
  sportType: SportType;
  initialPeriod?: StatisticsPeriod;
  skip?: boolean;
}

export interface UseSportStatsResult {
  stats: SportPeriodStatistics | null;
  period: StatisticsPeriod;
  setPeriod: (period: StatisticsPeriod) => void;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useSportStats(options: UseSportStatsOptions): UseSportStatsResult {
  const { sportType, initialPeriod = StatisticsPeriod.Month, skip = false } = options;

  const [period, setPeriod] = useState(initialPeriod);

  const variables = useMemo(() => ({ sportType, period }), [sportType, period]);

  const {
    data: rawData,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(SportPeriodStatisticsDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const stats = useMemo<SportPeriodStatistics | null>(
    () => rawData?.sportPeriodStatistics ?? null,
    [rawData?.sportPeriodStatistics],
  );

  const refetch = useCallback(async () => apolloRefetch(), [apolloRefetch]);

  return {
    stats,
    period,
    setPeriod,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
