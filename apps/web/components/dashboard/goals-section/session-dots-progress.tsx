'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { GoalStatus } from '@/gql/graphql';
import { getGoalStatusColors } from '@/components/goals/constants';
import type { SportColorConfig } from '@/lib/sports/config';

export interface SessionDotsProgressProps {
  current: number;
  target: number;
  className?: string;
  status?: GoalStatus;
  sportColor?: SportColorConfig;
}

export function SessionDotsProgress({ current, target, className, status, sportColor }: SessionDotsProgressProps) {
  const t = useTranslations('dashboard.goals');

  const displayCurrent = Math.min(current, target);
  const remaining = Math.max(target - current, 0);
  const dots = Array.from({ length: target }, (_, index) => index < displayCurrent);
  const statusColors = getGoalStatusColors(status);
  const effectiveBg = sportColor?.bg ?? statusColors.bg;
  const effectiveBgSubtle = sportColor?.bgMuted ?? statusColors.bgSubtle;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1.5 flex-wrap" role="img" aria-label={`${current} of ${target} sessions`}>
        {dots.map((isFilled, index) => (
          <div
            key={index}
            className={cn(
              'w-3 h-3 rounded-full transition-colors duration-300',
              isFilled ? effectiveBg : effectiveBgSubtle,
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {remaining === 0 ? t('completed') : remaining === 1 ? t('oneMore') : t('remaining', { count: remaining })}
      </p>
    </div>
  );
}
