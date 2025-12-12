'use client';

import { type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ActivityCardFragment } from '@/gql/graphql';
import { SportType } from '@/gql/graphql';
import { SPORT_TYPE_CONFIG } from '@/lib/activities/constants';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatElevation,
  formatDate,
  formatTime,
} from '@/lib/activities/formatters';

interface ActivityCardProps {
  activity: ActivityCardFragment;
  onClick?: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const t = useTranslations('activities.card');

  const sportConfig = SPORT_TYPE_CONFIG[activity.type as keyof typeof SPORT_TYPE_CONFIG] || {
    icon: Activity,
    color: 'text-gray-500',
    label: 'activities.sportTypes.other',
  };
  const Icon = sportConfig.icon;

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
      className={cn('transition-all', onClick && 'cursor-pointer hover:shadow-lg hover:border-strava-orange/50')}
      aria-label={
        onClick
          ? `${activity.name} - ${formatDate(activity.startDate)} - ${formatDistance(activity.distance)}`
          : undefined
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-strava-orange/10" aria-hidden="true">
            <Icon className="h-5 w-5 text-strava-orange" />
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('distance')}</p>
            <p className="font-semibold">{formatDistance(activity.distance)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t('duration')}</p>
            <p className="font-semibold">{formatDuration(activity.movingTime)}</p>
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

        {(activity.kudosCount > 0 || activity.maxHeartrate) && (
          <div className="flex gap-4 pt-4 mt-4 border-t text-sm text-muted-foreground">
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
        )}
      </CardContent>
    </Card>
  );
}
