'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useActivities } from '@/lib/activities/use-activities';
import { ActivityFilters } from '@/components/activities/activity-filters';
import { ActivityList } from '@/components/activities/activity-list';
import type { ActivityFilter } from '@/lib/activities/types';
import type { ActivityCardFragment } from '@/gql/graphql';
import { OrderBy, OrderDirection } from '@/lib/activities/constants';

export function ActivitiesPageContent() {
  const t = useTranslations('activities.page');
  const router = useRouter();

  const [filter, setFilter] = useState<ActivityFilter>({
    orderBy: OrderBy.Date,
    orderDirection: OrderDirection.Desc,
  });

  const { activities, loading, error, hasMore, loadMore, refetch } = useActivities({ filter });

  const handleFilterChange = useCallback((newFilter: ActivityFilter) => {
    setFilter(newFilter);
  }, []);

  const handleActivityClick = useCallback(
    (activity: ActivityCardFragment) => {
      router.push(`/activities/${activity.stravaId}`);
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <ActivityFilters filter={filter} onFilterChange={handleFilterChange} />

      <ActivityList
        activities={activities}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onActivityClick={handleActivityClick}
        refetch={refetch}
      />
    </div>
  );
}
