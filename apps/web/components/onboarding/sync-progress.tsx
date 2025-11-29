'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SyncStatusIndicator } from './sync-status-indicator';
import { SyncErrorCard } from './sync-error-card';
import { type SyncHistory, SyncStatus, SyncStage } from '@/gql/graphql';
import type { OnboardingError } from '@/lib/onboarding/error-handling';

function getProgressPercentage(stage: SyncStage | null | undefined, status: SyncStatus): number {
  if (status === SyncStatus.Completed) return 100;
  if (!stage) return 0;

  const stageMap: Record<SyncStage, number> = {
    [SyncStage.Fetching]: 25,
    [SyncStage.Storing]: 50,
    [SyncStage.Computing]: 75,
    [SyncStage.Done]: 100,
  };

  return stageMap[stage] ?? 0;
}

interface SyncProgressProps {
  syncStatus: SyncHistory | null;
  error: OnboardingError | null;
  isInitializing: boolean;
  isRedirecting: boolean;
  onRetry: () => void;
}

export function SyncProgress({ syncStatus, error, isInitializing, isRedirecting, onRetry }: SyncProgressProps) {
  const t = useTranslations('onboarding.sync');

  if (isInitializing) {
    return (
      <Card className="w-full min-h-[480px] flex flex-col">
        <CardHeader className="text-center">
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('status.pending')}</p>
            <div className="h-2 w-full bg-muted animate-pulse rounded-full" aria-label="Loading" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRedirecting) {
    return (
      <Card className="w-full min-h-[480px] flex flex-col">
        <CardHeader className="text-center">
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <CheckCircle className="h-12 w-12 text-green-500" aria-hidden="true" />
            <p className="text-lg font-medium text-green-600 dark:text-green-400">{t('status.done')}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t('redirecting')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <SyncErrorCard
        error={error}
        onRetry={error.retriable ? onRetry : undefined}
        onReconnect={
          error.type === 'token_expired'
            ? () => {
                window.location.href = '/auth/strava';
              }
            : undefined
        }
      />
    );
  }

  if (!syncStatus) {
    return null;
  }

  const progress = getProgressPercentage(syncStatus.stage, syncStatus.status);
  const showActivityCount = syncStatus.totalActivities > 0;

  return (
    <Card className="w-full min-h-[480px] flex flex-col">
      <CardHeader className="text-center">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4" role="status" aria-live="polite">
            <SyncStatusIndicator
              stage={SyncStage.Fetching}
              currentStage={syncStatus.stage}
              status={syncStatus.status}
            />
            <SyncStatusIndicator stage={SyncStage.Storing} currentStage={syncStatus.stage} status={syncStatus.status} />
            <SyncStatusIndicator
              stage={SyncStage.Computing}
              currentStage={syncStatus.stage}
              status={syncStatus.status}
            />
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2 progress-shimmer" aria-label={`Progress: ${progress}%`} />
            {showActivityCount && (
              <p className="text-center text-sm text-muted-foreground">
                {t('progress', {
                  current: syncStatus.processedActivities,
                  total: syncStatus.totalActivities,
                })}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
