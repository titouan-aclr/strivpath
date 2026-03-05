'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getProgressStatusFromGoal } from '@/lib/dashboard/utils';
import type { SecondaryGoal } from '@/lib/dashboard/types';
import { UNIT_LABELS } from '@/components/goals/constants';
import { getSportIcon, type SportColorConfig } from '@/lib/sports/config';
import { ProgressStatusBadge } from './progress-status-badge';
import { getEffectiveStatusColors } from './utils';

export interface SecondaryGoalCardProps {
  goal: SecondaryGoal;
  className?: string;
  sportColor?: SportColorConfig;
}

export function SecondaryGoalCard({ goal, className, sportColor }: SecondaryGoalCardProps) {
  const t = useTranslations('dashboard.goals');

  const SportIcon = getSportIcon(goal.sportType);
  const progressStatus = getProgressStatusFromGoal(goal);
  const displayPercentage = Math.min(goal.progressPercentage, 100);
  const unit = UNIT_LABELS[goal.targetType];
  const statusColors = getEffectiveStatusColors(goal.status, sportColor);

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
      <Card className={cn('transition-all hover:shadow-md cursor-pointer', statusColors.hoverBorder, className)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={cn('p-1.5 rounded-md shrink-0', statusColors.bgSubtle)}>
                <SportIcon className={cn('h-4 w-4', statusColors.text)} aria-hidden="true" />
              </div>
              <h4 className="font-medium text-sm truncate">{goal.title}</h4>
            </div>
            <ProgressStatusBadge status={progressStatus} size="sm" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {formatValue(displayCurrentValue, unit)} / {formatValue(displayTargetValue, unit)} {unit}
              </span>
              <span className={cn('font-semibold', statusColors.text)}>{goal.progressPercentage.toFixed(0)}%</span>
            </div>
            <div className={cn('h-1.5 rounded-full overflow-hidden', statusColors.bgSubtle)}>
              <div
                className={cn('h-full rounded-full transition-all duration-500 ease-out', statusColors.bg)}
                style={{ width: `${displayPercentage}%` }}
                role="progressbar"
                aria-valuenow={goal.currentValue}
                aria-valuemin={0}
                aria-valuemax={goal.targetValue}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{daysRemainingText}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatValue(value: number, unit: string): string {
  return unit === 'km' || unit === 'hours' ? value.toFixed(1) : Math.round(value).toString();
}
