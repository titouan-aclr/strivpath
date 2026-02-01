'use client';

import { cn } from '@/lib/utils';
import { GoalStatus } from '@/gql/graphql';
import { getGoalStatusColors } from '@/components/goals/constants';

export interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  status?: GoalStatus;
}

export function CircularProgress({ percentage, size = 80, strokeWidth = 8, className, status }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const displayPercentage = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (displayPercentage / 100) * circumference;
  const statusColors = getGoalStatusColors(status);

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
          className={statusColors.textSubtle}
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
          className={cn('transition-all duration-500 ease-out', statusColors.text)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{Math.round(displayPercentage)}%</span>
      </div>
    </div>
  );
}
