'use client';

import { Download, Database, Calculator, CheckCircle, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SyncStage, SyncStatus } from '@/gql/graphql';

const STAGE_ORDER = [SyncStage.Fetching, SyncStage.Storing, SyncStage.Computing, SyncStage.Done] as const;

const STAGE_CONFIG: Record<SyncStage, { icon: LucideIcon; labelKey: string }> = {
  [SyncStage.Fetching]: { icon: Download, labelKey: 'status.fetching' },
  [SyncStage.Storing]: { icon: Database, labelKey: 'status.storing' },
  [SyncStage.Computing]: { icon: Calculator, labelKey: 'status.computing' },
  [SyncStage.Done]: { icon: CheckCircle, labelKey: 'status.done' },
};

type StageState = 'pending' | 'active' | 'completed' | 'failed';

function getStageState(stage: SyncStage, currentStage: SyncStage | null | undefined, status: SyncStatus): StageState {
  if (status === SyncStatus.Failed) return 'failed';
  if (status === SyncStatus.Completed) return 'completed';

  if (!currentStage) return 'pending';

  const stageIndex = STAGE_ORDER.indexOf(stage);
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  if (currentIndex > stageIndex) return 'completed';
  if (currentIndex === stageIndex) return 'active';
  return 'pending';
}

interface SyncStatusIndicatorProps {
  stage: SyncStage;
  currentStage: SyncStage | null | undefined;
  status: SyncStatus;
}

export function SyncStatusIndicator({ stage, currentStage, status }: SyncStatusIndicatorProps) {
  const t = useTranslations('onboarding.sync');
  const config = STAGE_CONFIG[stage];
  const state = getStageState(stage, currentStage, status);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3" aria-label={t(config.labelKey)}>
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
          state === 'pending' && 'bg-muted text-muted-foreground',
          state === 'active' && 'bg-strava-orange text-white animate-pulse-slow',
          state === 'completed' && 'bg-green-500 text-white',
          state === 'failed' && 'bg-destructive text-destructive-foreground',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <p
          className={cn(
            'text-sm font-medium transition-colors',
            state === 'pending' && 'text-muted-foreground',
            state === 'active' && 'text-foreground',
            state === 'completed' && 'text-green-600 dark:text-green-400',
            state === 'failed' && 'text-destructive',
          )}
        >
          {t(config.labelKey)}
        </p>
      </div>
    </div>
  );
}
