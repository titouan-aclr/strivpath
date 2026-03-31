'use client';

import { Badge } from '@/components/ui/badge';
import { GoalStatus } from '@/gql/graphql';
import { useTranslations } from 'next-intl';

export interface GoalStatusBadgeProps {
  status: GoalStatus;
}

export function GoalStatusBadge({ status }: GoalStatusBadgeProps) {
  const t = useTranslations('goals.status');

  const config = {
    [GoalStatus.Active]: {
      variant: 'default' as const,
      label: t('active'),
      className: 'bg-accent-blue text-white hover:bg-accent-blue/90',
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
      className: 'bg-primary text-white hover:bg-primary/90',
    },
  }[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
