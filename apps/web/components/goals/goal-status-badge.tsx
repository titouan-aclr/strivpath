'use client';

import { useTranslations } from 'next-intl';
import { GoalStatus } from '@/gql/graphql';
import { Badge } from '@/components/ui/badge';

export interface GoalStatusBadgeProps {
  status: GoalStatus;
}

export function GoalStatusBadge({ status }: GoalStatusBadgeProps) {
  const t = useTranslations('goals.status');

  const config = {
    [GoalStatus.Active]: {
      variant: 'default' as const,
      label: t('active'),
      className: 'bg-goal-progress text-white hover:bg-goal-progress/90',
    },
    [GoalStatus.Completed]: {
      variant: 'default' as const,
      label: t('completed'),
      className: 'bg-green-500 text-white hover:bg-green-500/90',
    },
    [GoalStatus.Failed]: {
      variant: 'destructive' as const,
      label: t('failed'),
      className: '',
    },
    [GoalStatus.Archived]: {
      variant: 'default' as const,
      label: t('archived'),
      className: 'bg-strava-orange text-white hover:bg-strava-orange/90',
    },
  }[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
