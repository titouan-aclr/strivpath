'use client';

import { ViewOnStravaLink } from '@/components/strava/view-on-strava-link';
import { Badge } from '@/components/ui/badge';
import { SportType } from '@/gql/graphql';
import type { ActivityDetail } from '@/lib/activities/activity-types';
import { SPORT_TYPE_CONFIG } from '@/lib/activities/constants';
import { formatDate, formatTime } from '@/lib/activities/formatters';
import { Calendar, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ActivityHeaderProps {
  activity: ActivityDetail;
}

export function ActivityHeader({ activity }: ActivityHeaderProps) {
  const t = useTranslations('activities.detail');

  const activityType = activity.type.toUpperCase() as SportType;
  const sportConfig = SPORT_TYPE_CONFIG[activityType];
  const Icon = sportConfig?.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{activity.name}</h1>
          <div className="flex flex-wrap gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {formatDate(activity.startDate, 'en', 'long')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {formatTime(activity.startDate)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary hover:bg-primary/90 px-3 py-1.5">
            {t(`sportTypes.${activity.type.toLowerCase()}`)}
          </Badge>
          <ViewOnStravaLink variant="button" stravaId={activity.stravaId} />
        </div>
      </div>
    </div>
  );
}
