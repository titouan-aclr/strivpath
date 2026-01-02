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
      className: 'bg-strava-orange text-white',
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
      variant: 'secondary' as const,
      label: t('archived'),
      className: '',
    },
  }[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
