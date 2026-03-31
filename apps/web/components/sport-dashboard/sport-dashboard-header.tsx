'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getSportConfig } from '@/lib/sports/config';
import { formatTimeAgo, type TimeAgoTranslations } from '@/lib/dashboard/utils';
import type { SportType } from '@/gql/graphql';

const SPORT_TRANSLATION_KEY: Record<string, string> = {
  RUN: 'running',
  RIDE: 'cycling',
  SWIM: 'swimming',
};

export interface SportDashboardHeaderProps {
  sportType: SportType;
  lastSyncTime?: Date | string | null;
  loading?: boolean;
}

export function SportDashboardHeader({ sportType, lastSyncTime, loading }: SportDashboardHeaderProps) {
  const t = useTranslations('sportDashboard.header');
  const tSports = useTranslations('navigation.sports');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const timeAgoTranslations: TimeAgoTranslations = {
    justNow: tCommon('timeAgo.justNow'),
    minutesAgo: (count: number) => tCommon('timeAgo.minutesAgo', { count }),
    hoursAgo: (count: number) => tCommon('timeAgo.hoursAgo', { count }),
    daysAgo: (count: number) => tCommon('timeAgo.daysAgo', { count }),
  };

  if (loading) {
    return <SportDashboardHeaderSkeleton />;
  }

  const config = getSportConfig(sportType);
  const SportIcon = config?.icon;
  const sportColors = config?.colors;
  const sportName = tSports(SPORT_TRANSLATION_KEY[sportType] ?? 'running');

  const lastSyncText = lastSyncTime ? formatTimeAgo(lastSyncTime, timeAgoTranslations, locale) : null;

  return (
    <header className="flex items-center gap-3">
      {SportIcon && sportColors && (
        <div className={`${sportColors.bgMuted} rounded-lg p-2.5`}>
          <SportIcon className={`h-6 w-6 ${sportColors.text}`} aria-hidden="true" />
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title', { sport: sportName })}</h1>
        {lastSyncText && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('lastSync', { time: lastSyncText })}</span>
          </div>
        )}
        {!lastSyncText && <p className="mt-1 text-sm text-muted-foreground">{t('neverSynced')}</p>}
      </div>
    </header>
  );
}

function SportDashboardHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-11 w-11 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
