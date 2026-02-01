'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface DashboardErrorProps {
  onRetry: () => void;
}

export function DashboardError({ onRetry }: DashboardErrorProps) {
  const t = useTranslations('dashboard.error');

  return (
    <Card className="border-destructive">
      <CardContent className="py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium text-destructive mb-1">{t('title')}</p>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <Button onClick={onRetry} variant="outline" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
