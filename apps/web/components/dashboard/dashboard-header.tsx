'use client';

import { useTranslations, useLocale } from 'next-intl';
import { RefreshCw, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSync } from '@/lib/sync/context';
import { formatTimeAgo, type TimeAgoTranslations } from '@/lib/dashboard/utils';
import type { DashboardUser, DashboardSyncHistory } from '@/lib/dashboard/types';

export interface DashboardHeaderProps {
  user: DashboardUser | null;
  syncHistory: DashboardSyncHistory | null;
  loading?: boolean;
}

export function DashboardHeader({ user, syncHistory, loading }: DashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { isSyncing, isPolling, triggerSync } = useSync();

  const handleSyncClick = () => {
    triggerSync('manual');
  };

  const syncing = isSyncing || isPolling;

  if (loading) {
    return <DashboardHeaderSkeleton />;
  }

  const greeting = user?.firstname ? t('greeting', { name: user.firstname }) : t('greetingFallback');

  const timeAgoTranslations: TimeAgoTranslations = {
    justNow: tCommon('timeAgo.justNow'),
    minutesAgo: (count: number) => tCommon('timeAgo.minutesAgo', { count }),
    hoursAgo: (count: number) => tCommon('timeAgo.hoursAgo', { count }),
    daysAgo: (count: number) => tCommon('timeAgo.daysAgo', { count }),
  };

  const lastSyncText = syncHistory?.completedAt
    ? formatTimeAgo(syncHistory.completedAt, timeAgoTranslations, locale)
    : null;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
        {lastSyncText && (
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('sync.lastSync', { time: lastSyncText })}</span>
          </div>
        )}
        {!lastSyncText && !loading && <p className="text-sm text-muted-foreground mt-1">{t('sync.never')}</p>}
      </div>

      <Button variant="outline" size="sm" onClick={handleSyncClick} disabled={syncing} className="gap-2 self-start">
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('sync.syncing')}
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('sync.syncNow')}
          </>
        )}
      </Button>
    </header>
  );
}

function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );
}
