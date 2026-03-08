'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function GoalDetailError() {
  const router = useRouter();
  const t = useTranslations('goals.detail.error');

  const handleGoBack = () => {
    router.push('/goals');
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('goBack')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
