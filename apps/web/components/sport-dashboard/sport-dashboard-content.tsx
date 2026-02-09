'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Activity } from 'lucide-react';
import { useSportActivities } from '@/lib/sport-dashboard/hooks/use-sport-activities';
import { useSync } from '@/lib/sync/context';
import { getSportConfig } from '@/lib/sports/config';
import { cn } from '@/lib/utils';
import { DashboardError } from '@/components/dashboard/dashboard-error';
import { EmptyState } from '@/components/dashboard/empty-state';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { SportDashboardHeader } from './sport-dashboard-header';
import { PerformanceOverviewSection } from './performance-overview-section';
import { ProgressionChartSection } from './progression-chart';
import { SportGoalsSection } from './sport-goals-section';
import { PersonalRecordsSection } from './personal-records-section';
import { SportDashboardSkeleton } from './sport-dashboard-skeleton';
import type { SportType } from '@/gql/graphql';

const SPORT_TRANSLATION_KEY: Record<string, string> = {
  RUN: 'running',
  RIDE: 'cycling',
  SWIM: 'swimming',
};

const RECENT_ACTIVITIES_LIMIT = 3;

export interface SportDashboardContentProps {
  sportType: SportType;
}

export function SportDashboardContent({ sportType }: SportDashboardContentProps) {
  const t = useTranslations('sportDashboard.empty');
  const tRecentActivities = useTranslations('sportDashboard.recentActivities');
  const tSports = useTranslations('navigation.sports');
  const { syncHistory } = useSync();
  const { activities, loading, error, refetch } = useSportActivities({
    sportType,
    limit: RECENT_ACTIVITIES_LIMIT,
  });

  const hasActivities = activities.length > 0;
  const lastSyncTime = syncHistory?.completedAt ?? null;
  const sportName = tSports(SPORT_TRANSLATION_KEY[sportType] ?? 'running');

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (error && !hasActivities) {
    return <DashboardError onRetry={handleRetry} />;
  }

  if (loading && !hasActivities) {
    return <SportDashboardSkeleton />;
  }

  if (!hasActivities && !loading) {
    return (
      <div className="space-y-6">
        <SportDashboardHeader sportType={sportType} lastSyncTime={lastSyncTime} />
        <EmptyState
          icon={<Activity className="h-12 w-12" aria-hidden="true" />}
          title={t('title')}
          description={t('description', { sport: sportName })}
        />
      </div>
    );
  }

  const config = getSportConfig(sportType);
  const SportIcon = config?.icon;
  const sportColors = config?.colors;

  const sportEmptyIcon =
    SportIcon && sportColors ? (
      <div className={cn('rounded-lg p-3 mb-3', sportColors.bgMuted)}>
        <SportIcon className={cn('h-8 w-8', sportColors.text)} aria-hidden="true" />
      </div>
    ) : undefined;

  return (
    <div className="space-y-6">
      <SportDashboardHeader sportType={sportType} lastSyncTime={lastSyncTime} />
      <PerformanceOverviewSection sportType={sportType} />
      <ProgressionChartSection sportType={sportType} />
      <SportGoalsSection sportType={sportType} />
      <PersonalRecordsSection sportType={sportType} />
      <RecentActivities
        activities={activities}
        loading={loading}
        emptyIcon={sportEmptyIcon}
        emptyMessage={tRecentActivities('empty')}
        sportColor={sportColors}
      />
    </div>
  );
}
