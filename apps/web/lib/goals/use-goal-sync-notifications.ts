'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

export interface GoalSyncNotificationData {
  goalsUpdatedCount?: number;
  goalsCompletedCount?: number;
  completedGoalIds?: number[];
}

export function useGoalSyncNotifications() {
  const t = useTranslations('goals.sync');
  const router = useRouter();

  const notifyGoalUpdates = (data: GoalSyncNotificationData) => {
    if (!data.goalsUpdatedCount || data.goalsUpdatedCount === 0) {
      return;
    }

    if (data.goalsCompletedCount && data.goalsCompletedCount > 0) {
      toast.success(t('goalsCompleted', { count: data.goalsCompletedCount }), {
        duration: 5000,
        action: {
          label: t('viewGoals'),
          onClick: () => router.push('/goals'),
        },
      });
    } else {
      toast.info(t('goalsUpdated', { count: data.goalsUpdatedCount }), {
        duration: 3000,
      });
    }
  };

  return { notifyGoalUpdates };
}
