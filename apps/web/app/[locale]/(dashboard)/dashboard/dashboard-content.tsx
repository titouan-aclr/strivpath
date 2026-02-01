'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard/use-dashboard';
import { StatisticsPeriod } from '@/lib/dashboard/types';
import { getCurrentYear } from '@/lib/dashboard/utils';
import { useSync } from '@/lib/sync/context';
import {
  DashboardHeader,
  DashboardSkeleton,
  StatsSection,
  GoalsSection,
  ActivityHeatmap,
  SportDistribution,
  RecentActivities,
  EmptyState,
} from '@/components/dashboard';
import type { ActivityCardFragment } from '@/gql/graphql';

export function DashboardContent() {
  const { triggerSync, isSyncing, isPolling } = useSync();
  const [period, setPeriod] = useState<StatisticsPeriod>(StatisticsPeriod.Week);
  const currentYear = getCurrentYear();

  const {
    periodStatistics,
    primaryGoal,
    secondaryGoals,
    activityCalendar,
    sportDistribution,
    recentActivities,
    latestSyncHistory,
    currentUser,
    loading,
    hasActivities,
    hasMultipleSports,
    refetch,
  } = useDashboard({
    period,
    year: currentYear,
    month: null,
    activitiesLimit: 3,
  });

  const handlePeriodChange = useCallback(
    (newPeriod: StatisticsPeriod) => {
      setPeriod(newPeriod);
      void refetch({ period: newPeriod });
    },
    [refetch],
  );

  const handleSyncClick = useCallback(() => {
    triggerSync('manual');
  }, [triggerSync]);

  if (loading && !periodStatistics) {
    return <DashboardSkeleton />;
  }

  if (!hasActivities && !loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader user={currentUser} syncHistory={latestSyncHistory} loading={loading} />
        <NewUserEmptyState onSyncClick={handleSyncClick} isSyncing={isSyncing || isPolling} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader user={currentUser} syncHistory={latestSyncHistory} loading={loading} />

      <StatsSection statistics={periodStatistics} period={period} onPeriodChange={handlePeriodChange} loading={false} />

      <GoalsSection primaryGoal={primaryGoal} secondaryGoals={secondaryGoals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hasMultipleSports && (
          <div className="lg:col-span-1">
            <SportDistribution distribution={sportDistribution} />
          </div>
        )}
        <div className={hasMultipleSports ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <ActivityHeatmap calendarData={activityCalendar} year={currentYear} />
        </div>
      </div>

      <RecentActivities activities={recentActivities as unknown as ActivityCardFragment[]} loading={false} />
    </div>
  );
}

interface NewUserEmptyStateProps {
  onSyncClick: () => void;
  isSyncing: boolean;
}

function NewUserEmptyState({ onSyncClick, isSyncing }: NewUserEmptyStateProps) {
  const t = useTranslations('dashboard.newUser');
  const tSync = useTranslations('dashboard.sync');

  return (
    <EmptyState
      icon={<Upload className="h-12 w-12" aria-hidden="true" />}
      title={t('title')}
      description={t('description')}
      action={{
        label: isSyncing ? tSync('syncing') : t('cta'),
        onClick: onSyncClick,
      }}
    />
  );
}
