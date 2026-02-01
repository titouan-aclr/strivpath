'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { PeriodStatisticsDocument, PeriodStatisticsFragmentFragmentDoc, StatisticsPeriod } from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';
import type { PeriodStats } from './types';

interface UsePeriodStatisticsOptions {
  period?: StatisticsPeriod;
  skip?: boolean;
}

interface UsePeriodStatisticsResult {
  statistics: PeriodStats | null;
  loading: boolean;
  error: Error | undefined;
  refetch: (period?: StatisticsPeriod) => Promise<unknown>;
}

export function usePeriodStatistics(options: UsePeriodStatisticsOptions = {}): UsePeriodStatisticsResult {
  const { period = StatisticsPeriod.Week, skip = false } = options;

  const variables = useMemo(() => ({ period }), [period]);

  const {
    data: rawData,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(PeriodStatisticsDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const statistics = useMemo<PeriodStats | null>(() => {
    if (!rawData?.periodStatistics) return null;
    const fragment = getFragmentData(PeriodStatisticsFragmentFragmentDoc, rawData.periodStatistics);
    return {
      totalTime: fragment.totalTime,
      activityCount: fragment.activityCount,
      averageTimePerSession: fragment.averageTimePerSession,
      periodStart: fragment.periodStart,
      periodEnd: fragment.periodEnd,
    };
  }, [rawData?.periodStatistics]);

  const refetch = useCallback(
    async (newPeriod?: StatisticsPeriod) => {
      return apolloRefetch(newPeriod ? { period: newPeriod } : undefined);
    },
    [apolloRefetch],
  );

  return {
    statistics,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}

export { StatisticsPeriod };
