'use client';

import { useTranslations } from 'next-intl';
import { GoalStatus } from '@/gql/graphql';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  current: number;
  target: number;
  unit: string;
  status: GoalStatus;
  percentage: number;
  className?: string;
}

export function ProgressBar({ current, target, unit, status, percentage, className }: ProgressBarProps) {
  const t = useTranslations('goals.progress');

  const getBarColor = () => {
    if (status === GoalStatus.Completed) return 'bg-green-500';
    if (status === GoalStatus.Failed) return 'bg-destructive';
    if (status === GoalStatus.Archived) return 'bg-strava-orange';
    return 'bg-goal-progress';
  };

  const getBackgroundColor = () => {
    if (status === GoalStatus.Completed) return 'bg-green-500/10';
    if (status === GoalStatus.Failed) return 'bg-destructive/10';
    if (status === GoalStatus.Archived) return 'bg-strava-orange/10';
    return 'bg-goal-progress/10';
  };

  const displayPercentage = Math.min(percentage, 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {formatValue(current, unit)} / {formatValue(target, unit)} {unit}
        </span>
        <span
          className={cn(
            'font-bold',
            status === GoalStatus.Completed && 'text-green-500',
            status === GoalStatus.Failed && 'text-destructive',
            status === GoalStatus.Active && 'text-goal-progress',
            status === GoalStatus.Archived && 'text-strava-orange',
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className={cn('relative h-3 rounded-full overflow-hidden', getBackgroundColor())}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', getBarColor())}
          style={{ width: `${displayPercentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuetext={`${percentage.toFixed(1)}% - ${formatValue(current, unit)} of ${formatValue(target, unit)} ${unit}`}
          aria-label={t('label', { current, target, unit })}
        />
      </div>
    </div>
  );
}

function formatValue(value: number, unit: string): string {
  return unit === 'km' || unit === 'hours' ? value.toFixed(1) : Math.round(value).toString();
}
