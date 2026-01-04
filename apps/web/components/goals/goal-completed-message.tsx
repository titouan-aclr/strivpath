'use client';

import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function GoalCompletedMessage() {
  const t = useTranslations('goals.detail.completed');

  return (
    <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-500/20">
            <Trophy className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-700 dark:text-green-400">{t('title')}</h3>
            <p className="text-green-600 dark:text-green-500">{t('message')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
