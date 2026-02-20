'use client';

import { type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ActivityCardFragment } from '@/gql/graphql';
import { SportType } from '@/gql/graphql';
import { SPORT_TYPE_CONFIG } from '@/lib/activities/constants';
import type { SportColorConfig } from '@/lib/sports/config';
import {
  formatDistance,
  formatDurationFull,
  formatPace,
  formatElevation,
  formatDate,
  formatTime,
} from '@/lib/activities/formatters';
import { ViewOnStravaLink } from '@/components/strava/view-on-strava-link';

export interface ActivityCardProps {
  activity: ActivityCardFragment;
  onClick?: () => void;
  variant?: 'full' | 'compact';
  sportColor?: SportColorConfig;
}

export function ActivityCard({ activity, onClick, variant = 'full', sportColor }: ActivityCardProps) {
  const t = useTranslations('activities.card');

  const sportType = activity.type as SportType;
  const sportConfig = SPORT_TYPE_CONFIG[sportType];
  const Icon = sportConfig?.icon ?? Activity;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const isPaceMetric = activity.type === (SportType.Run as string) || activity.type === (SportType.Swim as string);

  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn('transition-all', onClick && 'cursor-pointer card-hover')}
      aria-label={
        onClick
          ? `${activity.name} - ${formatDate(activity.startDate)} - ${formatDistance(activity.distance)}`
          : undefined
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', sportColor?.bgMuted ?? 'bg-primary/10')} aria-hidden="true">
            <Icon className={cn('h-5 w-5', sportColor?.text ?? 'text-primary')} />
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{activity.name}</CardTitle>
            <CardDescription>
              {formatDate(activity.startDate)} • {formatTime(activity.startDate)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="stats-grid">
          <div>
            <p className="text-xs text-muted-foreground">{t('distance')}</p>
            <p className="font-semibold">{formatDistance(activity.distance)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t('duration')}</p>
            <p className="font-semibold">{formatDurationFull(activity.movingTime)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t('elevation')}</p>
            <p className="font-semibold">{formatElevation(activity.totalElevationGain)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{isPaceMetric ? t('pace') : t('speed')}</p>
            <p className="font-semibold">
              {formatPace(activity.distance, activity.movingTime, activity.type as SportType)}
            </p>
          </div>
        </div>

        {variant === 'full' && (
          <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t text-sm text-muted-foreground">
            <div className="flex gap-4">
              {activity.kudosCount > 0 && (
                <div className="flex items-center gap-1" aria-label={`${activity.kudosCount} ${t('kudos')}`}>
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  <span>{activity.kudosCount}</span>
                </div>
              )}
              {activity.maxHeartrate && (
                <div className="flex items-center gap-1" aria-label={`${activity.maxHeartrate} bpm`}>
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  <span>{activity.maxHeartrate} bpm</span>
                </div>
              )}
            </div>
            <ViewOnStravaLink variant="inline" stravaId={activity.stravaId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
