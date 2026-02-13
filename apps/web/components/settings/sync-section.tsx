'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncStage, SyncStatus } from '@/gql/graphql';
import { useSync } from '@/lib/sync/context';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SyncSection() {
  const t = useTranslations('settings.sync');
  const { syncHistory, isLoading, isSyncing, isPolling, triggerSync } = useSync();

  const handleSyncNow = () => {
    triggerSync('manual');
  };

  const formatLastSync = (date: Date | string): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getStatusIcon = (status: SyncStatus, stage: SyncStage | null | undefined) => {
    if (status === SyncStatus.Completed || (status === SyncStatus.InProgress && stage === SyncStage.Done)) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />;
    }
    if (status === SyncStatus.Failed) {
      return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />;
    }
    return <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />;
  };

  const getStatusKey = (status: SyncStatus, stage: SyncStage | null | undefined): string => {
    if (status === SyncStatus.Completed) return 'done';
    if (status === SyncStatus.Failed) return 'failed';
    if (status === SyncStatus.Pending) return 'pending';
    if (status === SyncStatus.InProgress && stage) {
      const stageMap: Record<SyncStage, string> = {
        [SyncStage.Fetching]: 'fetching',
        [SyncStage.Storing]: 'storing',
        [SyncStage.Computing]: 'computing',
        [SyncStage.Done]: 'done',
      };
      return stageMap[stage] || 'pending';
    }
    return 'pending';
  };

  const syncing = isSyncing || isPolling;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" aria-hidden="true" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">{t('lastSync')}:</span>
              <span className="font-medium">
                {syncHistory?.completedAt ? formatLastSync(syncHistory.completedAt) : t('never')}
              </span>
            </div>

            {syncHistory && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
                  {getStatusIcon(syncHistory.status, syncHistory.stage)}
                  {t(`status.${getStatusKey(syncHistory.status, syncHistory.stage)}`)}
                </Badge>
                {syncHistory.totalActivities !== null && syncHistory.totalActivities > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {t('activitiesImported', { count: syncHistory.totalActivities })}
                  </span>
                )}
              </div>
            )}
          </div>

          <Button variant="outline" className="gap-2" onClick={handleSyncNow} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t('syncing')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t('syncNow')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
