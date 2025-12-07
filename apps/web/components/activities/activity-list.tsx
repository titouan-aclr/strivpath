'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Activity as ActivityIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ActivityCardFragment } from '@/gql/graphql';
import { ActivityCard } from './activity-card';
import { ActivityListSkeleton } from './activity-list-skeleton';

interface ActivityListProps {
  activities: ActivityCardFragment[];
  loading: boolean;
  error?: unknown;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onActivityClick?: (activity: ActivityCardFragment) => void;
  refetch?: () => Promise<void>;
}

export function ActivityList({
  activities,
  loading,
  error,
  hasMore,
  onLoadMore,
  onActivityClick,
  refetch,
}: ActivityListProps) {
  const t = useTranslations('activities.list');

  const observerTargetRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    loadingRef.current = loading;
    hasMoreRef.current = hasMore;
  }, [loading, hasMore]);

  useEffect(() => {
    if (!observerTargetRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          void onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      },
    );

    observer.observe(observerTargetRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-medium text-destructive mb-1">{t('error.title')}</p>
              <p className="text-sm text-muted-foreground">{t('error.description')}</p>
            </div>
            {refetch && (
              <Button onClick={() => void refetch()} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('error.retry')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && activities.length === 0) {
    return <ActivityListSkeleton count={5} />;
  }

  if (!loading && activities.length === 0) {
    return (
      <Card className="text-center p-12">
        <ActivityIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <CardTitle className="mb-2">{t('empty.title')}</CardTitle>
        <CardDescription>{t('empty.description')}</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite" aria-busy={loading}>
      {activities.map(activity => (
        <ActivityCard
          key={activity.stravaId.toString()}
          activity={activity}
          onClick={onActivityClick ? () => onActivityClick(activity) : undefined}
        />
      ))}

      {hasMore && (
        <div ref={observerTargetRef} className="py-4">
          <ActivityListSkeleton count={3} />
        </div>
      )}
    </div>
  );
}
