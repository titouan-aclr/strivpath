'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface GoalsEmptyStateProps {
  className?: string;
}

export function GoalsEmptyState({ className }: GoalsEmptyStateProps) {
  const t = useTranslations('dashboard.goals.empty');

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-3 rounded-full bg-primary/10 mb-4">
          <Target className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{t('title')}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">{t('description')}</p>
        <Button asChild>
          <Link href="/goals/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('cta')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
