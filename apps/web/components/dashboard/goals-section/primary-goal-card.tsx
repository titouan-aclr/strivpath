'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GoalTargetType, GoalStatus } from '@/gql/graphql';
import { getProgressStatusFromGoal } from '@/lib/dashboard/utils';
import type { PrimaryGoal } from '@/lib/dashboard/types';
import { UNIT_LABELS } from '@/components/goals/constants';
import { getSportIcon, type SportColorConfig } from '@/lib/sports/config';
import { GoalProgressChart } from './goal-progress-chart';
import { SessionDotsProgress } from './session-dots-progress';
import { CircularProgress } from './circular-progress';
import { ProgressStatusBadge } from './progress-status-badge';
import { getEffectiveStatusColors } from './utils';

export interface PrimaryGoalCardProps {
  goal: PrimaryGoal;
  className?: string;
  sportColor?: SportColorConfig;
}

export function PrimaryGoalCard({ goal, className, sportColor }: PrimaryGoalCardProps) {
  const t = useTranslations('dashboard.goals');

  const SportIcon = getSportIcon(goal.sportType);
  const progressStatus = getProgressStatusFromGoal(goal);
  const unit = UNIT_LABELS[goal.targetType];
  const hasProgressHistory = goal.progressHistory && goal.progressHistory.length > 0;
  const statusColors = getEffectiveStatusColors(goal.status, sportColor);
  const activeSportColor = sportColor && goal.status === GoalStatus.Active ? sportColor : undefined;

  const displayCurrentValue = goal.currentValue;
  const displayTargetValue = goal.targetValue;

  const daysRemainingText =
    goal.isExpired || goal.daysRemaining === null
      ? t('daysRemaining.expired')
      : goal.daysRemaining === 0
        ? t('daysRemaining.today')
        : goal.daysRemaining === 1
          ? t('daysRemaining.tomorrow')
          : t('daysRemaining.days', { count: goal.daysRemaining });

  return (
    <Link href={`/goals/${goal.id}`} className="block">
      <Card className={cn('transition-all hover:shadow-lg cursor-pointer', statusColors.hoverBorder, className)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={cn('p-2 rounded-lg shrink-0', statusColors.bgSubtle)}>
                <SportIcon className={cn('h-5 w-5', statusColors.text)} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate">{goal.title}</h3>
                <p className="text-sm text-muted-foreground">{daysRemainingText}</p>
              </div>
            </div>
            <ProgressStatusBadge status={progressStatus} />
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {formatValue(displayCurrentValue, unit)}{' '}
                <span className="text-base font-normal text-muted-foreground">
                  / {formatValue(displayTargetValue, unit)} {unit}
                </span>
              </p>
              <p className={cn('text-sm font-medium', statusColors.text)}>
                {t('progressComplete', { percentage: goal.progressPercentage.toFixed(1) })}
              </p>
            </div>

            {goal.targetType === GoalTargetType.Duration && (
              <CircularProgress
                percentage={goal.progressPercentage}
                size={70}
                strokeWidth={6}
                status={goal.status}
                sportColor={activeSportColor}
              />
            )}
          </div>

          {goal.targetType === GoalTargetType.Frequency ? (
            <SessionDotsProgress
              current={goal.currentValue}
              target={goal.targetValue}
              status={goal.status}
              sportColor={activeSportColor}
            />
          ) : hasProgressHistory ? (
            <GoalProgressChart
              progressHistory={goal.progressHistory}
              targetValue={displayTargetValue}
              startDate={goal.startDate}
              endDate={goal.endDate}
              unit={unit}
              className="h-[160px] w-full"
              status={goal.status}
              colorHex={activeSportColor?.chart}
            />
          ) : (
            <div className="space-y-2">
              <div className={cn('h-2 rounded-full overflow-hidden', statusColors.bgSubtle)}>
                <div
                  className={cn('h-full rounded-full transition-all duration-500 ease-out', statusColors.bg)}
                  style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={goal.currentValue}
                  aria-valuemin={0}
                  aria-valuemax={goal.targetValue}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function formatValue(value: number, unit: string): string {
  if (unit === 'hours') {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
  return unit === 'km' ? value.toFixed(1) : Math.round(value).toString();
}
