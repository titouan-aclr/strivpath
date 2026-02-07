'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  SportProgressionDataDocument,
  type ProgressionDataPoint,
  type SportType,
  ProgressionMetric,
  StatisticsPeriod,
} from '@/gql/graphql';
import { getAvailableMetrics } from '../types';

export interface UseSportProgressionOptions {
  sportType: SportType;
  initialPeriod?: StatisticsPeriod;
  initialMetric?: ProgressionMetric;
  skip?: boolean;
}

export interface UseSportProgressionResult {
  data: ProgressionDataPoint[];
  period: StatisticsPeriod;
  setPeriod: (period: StatisticsPeriod) => void;
  metric: ProgressionMetric;
  setMetric: (metric: ProgressionMetric) => void;
  availableMetrics: ProgressionMetric[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => Promise<unknown>;
}

export function useSportProgression(options: UseSportProgressionOptions): UseSportProgressionResult {
  const { sportType, initialPeriod = StatisticsPeriod.Week, initialMetric, skip = false } = options;

  const availableMetrics = useMemo(() => getAvailableMetrics(sportType), [sportType]);

  const defaultMetric = initialMetric ?? availableMetrics[0] ?? ProgressionMetric.Distance;

  const [period, setPeriod] = useState(initialPeriod);
  const [metric, setMetric] = useState(defaultMetric);

  const variables = useMemo(() => ({ sportType, period, metric }), [sportType, period, metric]);

  const {
    data: rawData,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(SportProgressionDataDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const data = useMemo<ProgressionDataPoint[]>(
    () => rawData?.sportProgressionData ?? [],
    [rawData?.sportProgressionData],
  );

  const refetch = useCallback(async () => apolloRefetch(), [apolloRefetch]);

  return {
    data,
    period,
    setPeriod,
    metric,
    setMetric,
    availableMetrics,
    loading,
    error: error as Error | undefined,
    refetch,
  };
}
