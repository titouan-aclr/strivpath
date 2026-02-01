'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  DashboardDataDocument,
  PeriodStatisticsFragmentFragmentDoc,
  PrimaryGoalFragmentFragmentDoc,
  SecondaryGoalFragmentFragmentDoc,
  ActivityCalendarDayFragmentFragmentDoc,
  SportDistributionFragmentFragmentDoc,
  ActivityCardFragmentDoc,
  DashboardSyncHistoryFragmentFragmentDoc,
  StatisticsPeriod,
  type ActivityCardFragment,
} from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';
import type {
  DashboardQueryVariables,
  PeriodStats,
  PrimaryGoal,
  SecondaryGoal,
  ActivityCalendarDay,
  SportDistributionItem,
  DashboardSyncHistory,
  DashboardUser,
  DashboardUserPreferences,
} from './types';
import { getCurrentYear, getCurrentMonth } from './utils';

interface UseDashboardOptions {
  period?: StatisticsPeriod;
  year?: number;
  month?: number | null;
  activitiesLimit?: number;
  skip?: boolean;
}

interface UseDashboardResult {
  periodStatistics: PeriodStats | null;
  primaryGoal: PrimaryGoal | null;
  secondaryGoals: SecondaryGoal[];
  activityCalendar: ActivityCalendarDay[];
  sportDistribution: SportDistributionItem[];
  recentActivities: ActivityCardFragment[];
  latestSyncHistory: DashboardSyncHistory | null;
  currentUser: DashboardUser | null;
  userPreferences: DashboardUserPreferences | null;
  loading: boolean;
  error: Error | undefined;
  refetch: (variables?: Partial<DashboardQueryVariables>) => Promise<unknown>;
  hasActivities: boolean;
  hasGoals: boolean;
  hasMultipleSports: boolean;
  showSportDistribution: boolean;
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardResult {
  const {
    period = StatisticsPeriod.Week,
    year = getCurrentYear(),
    month = getCurrentMonth(),
    activitiesLimit = 3,
    skip = false,
  } = options;

  const variables = useMemo<DashboardQueryVariables>(
    () => ({
      period,
      year,
      month,
      activitiesLimit,
    }),
    [period, year, month, activitiesLimit],
  );

  const {
    data: rawData,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery(DashboardDataDocument, {
    variables,
    skip,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const periodStatistics = useMemo<PeriodStats | null>(() => {
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

  const primaryGoal = useMemo<PrimaryGoal | null>(() => {
    if (!rawData?.primaryDashboardGoal) return null;
    const primaryFragment = getFragmentData(PrimaryGoalFragmentFragmentDoc, rawData.primaryDashboardGoal);
    const baseFragment = getFragmentData(SecondaryGoalFragmentFragmentDoc, primaryFragment);
    return {
      id: baseFragment.id,
      title: baseFragment.title,
      targetType: baseFragment.targetType,
      targetValue: baseFragment.targetValue,
      currentValue: baseFragment.currentValue,
      startDate: baseFragment.startDate,
      endDate: baseFragment.endDate,
      sportType: baseFragment.sportType ?? null,
      status: baseFragment.status,
      progressPercentage: baseFragment.progressPercentage,
      daysRemaining: baseFragment.daysRemaining ?? null,
      isExpired: baseFragment.isExpired,
      progressHistory: primaryFragment.progressHistory.map(point => ({
        date: point.date,
        value: point.value,
      })),
    };
  }, [rawData?.primaryDashboardGoal]);

  const secondaryGoals = useMemo<SecondaryGoal[]>(() => {
    if (!rawData?.secondaryDashboardGoals) return [];
    return rawData.secondaryDashboardGoals.map(goal => {
      const fragment = getFragmentData(SecondaryGoalFragmentFragmentDoc, goal);
      return {
        id: fragment.id,
        title: fragment.title,
        targetType: fragment.targetType,
        targetValue: fragment.targetValue,
        currentValue: fragment.currentValue,
        startDate: fragment.startDate,
        endDate: fragment.endDate,
        sportType: fragment.sportType ?? null,
        status: fragment.status,
        progressPercentage: fragment.progressPercentage,
        daysRemaining: fragment.daysRemaining ?? null,
        isExpired: fragment.isExpired,
      };
    });
  }, [rawData?.secondaryDashboardGoals]);

  const activityCalendar = useMemo<ActivityCalendarDay[]>(() => {
    if (!rawData?.activityCalendar) return [];
    return rawData.activityCalendar.map(day => {
      const fragment = getFragmentData(ActivityCalendarDayFragmentFragmentDoc, day);
      return {
        date: fragment.date,
        hasActivity: fragment.hasActivity,
      };
    });
  }, [rawData?.activityCalendar]);

  const sportDistribution = useMemo<SportDistributionItem[]>(() => {
    if (!rawData?.sportDistribution) return [];
    return rawData.sportDistribution.map(item => {
      const fragment = getFragmentData(SportDistributionFragmentFragmentDoc, item);
      return {
        sport: fragment.sport,
        percentage: fragment.percentage,
        totalTime: fragment.totalTime,
      };
    });
  }, [rawData?.sportDistribution]);

  const recentActivities = useMemo<ActivityCardFragment[]>(() => {
    if (!rawData?.activities) return [];
    return rawData.activities.map(activity => getFragmentData(ActivityCardFragmentDoc, activity));
  }, [rawData?.activities]);

  const latestSyncHistory = useMemo<DashboardSyncHistory | null>(() => {
    if (!rawData?.latestSyncHistory) return null;
    const fragment = getFragmentData(DashboardSyncHistoryFragmentFragmentDoc, rawData.latestSyncHistory);
    return {
      id: fragment.id,
      completedAt: fragment.completedAt ?? null,
      status: fragment.status,
      stage: fragment.stage ?? null,
    };
  }, [rawData?.latestSyncHistory]);

  const currentUser = useMemo<DashboardUser | null>(() => {
    if (!rawData?.currentUser) return null;
    return {
      id: rawData.currentUser.id,
      firstname: rawData.currentUser.firstname ?? null,
      lastname: rawData.currentUser.lastname ?? null,
    };
  }, [rawData?.currentUser]);

  const userPreferences = useMemo<DashboardUserPreferences | null>(() => {
    if (!rawData?.userPreferences) return null;
    return {
      selectedSports: rawData.userPreferences.selectedSports,
    };
  }, [rawData?.userPreferences]);

  const hasActivities = recentActivities.length > 0;
  const hasGoals = primaryGoal !== null || secondaryGoals.length > 0;
  const hasMultipleSports = (userPreferences?.selectedSports.length ?? 0) > 1;
  const showSportDistribution = hasMultipleSports && sportDistribution.length > 1;

  const refetch = useCallback(
    async (newVariables?: Partial<DashboardQueryVariables>) => {
      return apolloRefetch(newVariables ? { ...variables, ...newVariables } : undefined);
    },
    [apolloRefetch, variables],
  );

  return {
    periodStatistics,
    primaryGoal,
    secondaryGoals,
    activityCalendar,
    sportDistribution,
    recentActivities,
    latestSyncHistory,
    currentUser,
    userPreferences,
    loading,
    error: error as Error | undefined,
    refetch,
    hasActivities,
    hasGoals,
    hasMultipleSports,
    showSportDistribution,
  };
}
