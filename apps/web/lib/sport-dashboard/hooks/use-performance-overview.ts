'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  SportPeriodStatisticsDocument,
  SportAverageMetricsDocument,
  type SportPeriodStatistics,
  type SportAverageMetrics,
  type SportType,
  StatisticsPeriod,
} from '@/gql/graphql';

export interface UsePerformanceOverviewOptions {
  sportType: SportType;
  initialPeriod?: StatisticsPeriod;
  skip?: boolean;
}

export interface UsePerformanceOverviewResult {
  stats: SportPeriodStatistics | null;
  metrics: SportAverageMetrics | null;
  period: StatisticsPeriod;
  setPeriod: (period: StatisticsPeriod) => void;
  loading: boolean;
  statsLoading: boolean;
  metricsLoading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function usePerformanceOverview(options: UsePerformanceOverviewOptions): UsePerformanceOverviewResult {
  const { sportType, initialPeriod = StatisticsPeriod.Month, skip = false } = options;

  const [period, setPeriod] = useState(initialPeriod);

  const variables = useMemo(() => ({ sportType, period }), [sportType, period]);

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch: statsRefetch,
  } = useQuery(SportPeriodStatisticsDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const {
    data: metricsData,
    loading: metricsLoading,
    error: metricsError,
    refetch: metricsRefetch,
  } = useQuery(SportAverageMetricsDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const stats = useMemo<SportPeriodStatistics | null>(
    () => statsData?.sportPeriodStatistics ?? null,
    [statsData?.sportPeriodStatistics],
  );

  const metrics = useMemo<SportAverageMetrics | null>(
    () => metricsData?.sportAverageMetrics ?? null,
    [metricsData?.sportAverageMetrics],
  );

  const loading = statsLoading && metricsLoading;
  const error = (statsError ?? metricsError) as Error | undefined;

  const refetch = useCallback(async () => {
    await Promise.all([statsRefetch(), metricsRefetch()]);
  }, [statsRefetch, metricsRefetch]);

  return {
    stats,
    metrics,
    period,
    setPeriod,
    loading,
    statsLoading,
    metricsLoading,
    error,
    refetch,
  };
}
