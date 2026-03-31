'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { SportAverageMetricsDocument, type SportAverageMetrics, type SportType, StatisticsPeriod } from '@/gql/graphql';

export interface UseSportAverageMetricsOptions {
  sportType: SportType;
  initialPeriod?: StatisticsPeriod;
  skip?: boolean;
}

export interface UseSportAverageMetricsResult {
  metrics: SportAverageMetrics | null;
  period: StatisticsPeriod;
  setPeriod: (period: StatisticsPeriod) => void;
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useSportAverageMetrics(options: UseSportAverageMetricsOptions): UseSportAverageMetricsResult {
  const { sportType, initialPeriod = StatisticsPeriod.Month, skip = false } = options;

  const [period, setPeriod] = useState(initialPeriod);

  const variables = useMemo(() => ({ sportType, period }), [sportType, period]);

  const {
    data: rawData,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(SportAverageMetricsDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const metrics = useMemo<SportAverageMetrics | null>(
    () => rawData?.sportAverageMetrics ?? null,
    [rawData?.sportAverageMetrics],
  );

  const refetch = useCallback(async () => apolloRefetch(), [apolloRefetch]);

  return {
    metrics,
    period,
    setPeriod,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
