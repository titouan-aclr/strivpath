'use client';

import { cn } from '@/lib/utils';
import { GoalStatus } from '@/gql/graphql';
import { getGoalStatusColors } from '@/components/goals/constants';
import type { SportColorConfig } from '@/lib/sports/config';

export interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  status?: GoalStatus;
  sportColor?: SportColorConfig;
}

export function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
  className,
  status,
  sportColor,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const displayPercentage = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (displayPercentage / 100) * circumference;
  const statusColors = getGoalStatusColors(status);
  const effectiveTextClass = sportColor?.text ?? statusColors.text;
  const effectiveTextMutedClass = sportColor?.textMuted ?? statusColors.textSubtle;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className={effectiveTextMutedClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-500 ease-out', effectiveTextClass)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{Math.round(displayPercentage)}%</span>
      </div>
    </div>
  );
}
