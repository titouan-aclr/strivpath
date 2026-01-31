'use client';

import { useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import {
  DashboardDataDocument,
  PeriodStatisticsFragmentFragmentDoc,
  DashboardGoalFragmentFragmentDoc,
  ActivityCalendarDayFragmentFragmentDoc,
  SportDistributionFragmentFragmentDoc,
  ActivityCardFragmentDoc,
  DashboardSyncHistoryFragmentFragmentDoc,
  StatisticsPeriod,
} from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';
import type {
  DashboardData,
  DashboardQueryVariables,
  PeriodStats,
  DashboardGoal,
  ActivityCalendarDay,
  SportDistributionItem,
  DashboardActivity,
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
  data: DashboardData | null;
  periodStatistics: PeriodStats | null;
  dashboardGoals: DashboardGoal[];
  activityCalendar: ActivityCalendarDay[];
  sportDistribution: SportDistributionItem[];
  recentActivities: DashboardActivity[];
  latestSyncHistory: DashboardSyncHistory | null;
  currentUser: DashboardUser | null;
  userPreferences: DashboardUserPreferences | null;
  loading: boolean;
  error: Error | undefined;
  refetch: (variables?: Partial<DashboardQueryVariables>) => Promise<unknown>;
  hasActivities: boolean;
  hasGoals: boolean;
  hasMultipleSports: boolean;
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

  const dashboardGoals = useMemo<DashboardGoal[]>(() => {
    if (!rawData?.dashboardGoals) return [];
    return rawData.dashboardGoals.map(goal => {
      const fragment = getFragmentData(DashboardGoalFragmentFragmentDoc, goal);
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
        progressHistory: fragment.progressHistory.map(point => ({
          date: point.date,
          value: point.value,
        })),
      };
    });
  }, [rawData?.dashboardGoals]);

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

  const recentActivities = useMemo<DashboardActivity[]>(() => {
    if (!rawData?.activities) return [];
    return rawData.activities.map(activity => {
      const fragment = getFragmentData(ActivityCardFragmentDoc, activity);
      return {
        id: fragment.id,
        stravaId: String(fragment.stravaId),
        name: fragment.name,
        type: fragment.type,
        distance: fragment.distance,
        movingTime: fragment.movingTime,
        elapsedTime: fragment.elapsedTime,
        totalElevationGain: fragment.totalElevationGain,
        startDate: fragment.startDate,
        averageSpeed: fragment.averageSpeed ?? null,
        maxHeartrate: fragment.maxHeartrate ?? null,
        kudosCount: fragment.kudosCount,
      };
    });
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

  const data = useMemo<DashboardData | null>(() => {
    if (!rawData) return null;
    return {
      periodStatistics: periodStatistics!,
      dashboardGoals,
      activityCalendar,
      sportDistribution,
      activities: recentActivities,
      latestSyncHistory,
      currentUser,
      userPreferences,
    };
  }, [
    rawData,
    periodStatistics,
    dashboardGoals,
    activityCalendar,
    sportDistribution,
    recentActivities,
    latestSyncHistory,
    currentUser,
    userPreferences,
  ]);

  const hasActivities = recentActivities.length > 0;
  const hasGoals = dashboardGoals.length > 0;
  const hasMultipleSports = (userPreferences?.selectedSports.length ?? 0) > 1;

  const refetch = useCallback(
    async (newVariables?: Partial<DashboardQueryVariables>) => {
      return apolloRefetch(newVariables ? { ...variables, ...newVariables } : undefined);
    },
    [apolloRefetch, variables],
  );

  return {
    data,
    periodStatistics,
    dashboardGoals,
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
  };
}
