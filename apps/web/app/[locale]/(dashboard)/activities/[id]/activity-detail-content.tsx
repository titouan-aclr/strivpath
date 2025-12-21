'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityHeader } from '@/components/activities/detail/activity-header';
import { StatsGrid } from '@/components/activities/detail/stats-grid';
import { SplitsChart } from '@/components/activities/detail/splits-chart';
import { ActivityDetailSkeleton } from '@/components/activities/detail/activity-detail-skeleton';
import { useActivityDetail } from '@/lib/activities/use-activity-detail';

interface ActivityDetailContentProps {
  stravaId: string;
}

export function ActivityDetailContent({ stravaId }: ActivityDetailContentProps) {
  const t = useTranslations('activities.detail');
  const { activity, loading, error, refetch, isValidId } = useActivityDetail({ stravaId });

  if (!isValidId) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-medium text-destructive mb-1">{t('invalidId.title')}</p>
              <p className="text-sm text-muted-foreground">{t('invalidId.description')}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/activities">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('invalidId.backButton')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <ActivityDetailSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-medium text-destructive mb-1">{t('error.title')}</p>
              <p className="text-sm text-muted-foreground mb-2">{t('error.description')}</p>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{error.message}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void refetch()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('error.retry')}
              </Button>
              <Button asChild variant="ghost">
                <Link href="/activities">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('error.backButton')}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activity) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium mb-1">{t('notFound.title')}</p>
              <p className="text-sm text-muted-foreground">{t('notFound.description')}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/activities">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('notFound.backButton')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/activities">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backButton')}
        </Link>
      </Button>

      <ActivityHeader activity={activity} />
      <StatsGrid activity={activity} />
      <SplitsChart activity={activity} />
    </div>
  );
}
