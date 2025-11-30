'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@/lib/graphql';
import { SyncStatusDocument } from '@/gql/graphql';
import { CONFIRMATION_AUTO_REDIRECT_MS } from '@/lib/onboarding/constants';

export default function ConfirmationPage() {
  const router = useRouter();
  const t = useTranslations('onboarding.confirmation');

  const { data } = useQuery(SyncStatusDocument, { fetchPolicy: 'cache-first' });
  const activityCount = data?.syncStatus?.totalActivities ?? 0;

  useEffect(() => {
    const timeout = setTimeout(() => router.push('/dashboard'), CONFIRMATION_AUTO_REDIRECT_MS);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <Card className="w-full min-h-[480px] flex flex-col">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <CardTitle className="text-2xl text-green-600 dark:text-green-400">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-4">
          {activityCount > 0 && (
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">{activityCount}</p>
              <p className="text-sm text-muted-foreground">{t('activitiesImported')}</p>
            </div>
          )}
          <div className="space-y-2 pt-4">
            <p className="text-sm font-medium">{t('whatsNext.title')}</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>{t('whatsNext.viewDashboard')}</li>
              <li>{t('whatsNext.trackProgress')}</li>
              <li>{t('whatsNext.setGoals')}</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button onClick={() => router.push('/dashboard')} size="lg" className="gap-2">
            {t('goToDashboard')}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('autoRedirect', { seconds: CONFIRMATION_AUTO_REDIRECT_MS / 1000 })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
