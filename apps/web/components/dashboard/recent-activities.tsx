'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityCard } from '@/components/activities/activity-card';
import type { ActivityCardFragment } from '@/gql/graphql';

export interface RecentActivitiesProps {
  activities: ActivityCardFragment[];
  loading?: boolean;
}

export function RecentActivities({ activities, loading }: RecentActivitiesProps) {
  const t = useTranslations('dashboard.recentActivities');
  const router = useRouter();

  const handleActivityClick = (activity: ActivityCardFragment) => {
    router.push(`/activities/${activity.stravaId}`);
  };

  const handleViewAll = () => {
    router.push('/activities');
  };

  if (loading) {
    return <RecentActivitiesSkeleton />;
  }

  return (
    <section aria-labelledby="recent-activities-title">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle id="recent-activities-title" className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
            {activities.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleViewAll} className="gap-1">
                {t('viewAll')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <RecentActivitiesEmpty />
          ) : (
            <div className="space-y-3">
              {activities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  variant="compact"
                  onClick={() => handleActivityClick(activity)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function RecentActivitiesEmpty() {
  const t = useTranslations('dashboard.recentActivities');

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Activity className="h-12 w-12 text-muted-foreground mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{t('empty')}</p>
    </div>
  );
}

function RecentActivitiesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="flex gap-3 mb-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-4 w-2/5" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
