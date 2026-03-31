'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { TrendingDown, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function GoalFailedMessage() {
  const router = useRouter();
  const t = useTranslations('goals.detail.failed');

  const handleCreateNew = () => {
    router.push('/goals/new');
  };

  return (
    <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-amber-500/20">
            <TrendingDown className="h-8 w-8 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-amber-700 dark:text-amber-400 mb-2">{t('title')}</h3>
            <p className="text-amber-600 dark:text-amber-500 mb-4">{t('message')}</p>
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t('createNew')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
