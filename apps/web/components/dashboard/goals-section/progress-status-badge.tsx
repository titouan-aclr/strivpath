'use client';

import { Badge } from '@/components/ui/badge';
import type { ProgressStatus } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface ProgressStatusBadgeProps {
  status: ProgressStatus;
  size?: 'default' | 'sm';
  className?: string;
}

const STATUS_CONFIG = {
  ahead: {
    labelKey: 'ahead',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  behind: {
    labelKey: 'behind',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  onTrack: {
    labelKey: 'onTrack',
    className: 'bg-accent-blue/10 text-accent-blue',
  },
} as const;

const SIZE_CLASSES = {
  default: 'text-xs',
  sm: 'text-[10px] px-1.5 py-0 h-5',
} as const;

export function ProgressStatusBadge({ status, size = 'default', className }: ProgressStatusBadgeProps) {
  const t = useTranslations('dashboard.goals');
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn('shrink-0 border-0', SIZE_CLASSES[size], config.className, className)}>
      {t(config.labelKey)}
    </Badge>
  );
}
