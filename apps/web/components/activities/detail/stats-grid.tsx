'use client';

import { useTranslations } from 'next-intl';
import { Route, Timer, TrendingUp, Gauge, Heart, Activity, Footprints, Mountain, Flame, Zap } from 'lucide-react';
import { StatCard } from './stat-card';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatDistance,
  formatDurationFull,
  formatElevation,
  formatPace,
  formatAltitudeRange,
  formatCalories,
  formatWatts,
} from '@/lib/activities/formatters';
import { SportType } from '@/gql/graphql';
import type { ActivityDetail } from '@/lib/activities/activity-types';

interface StatsGridProps {
  activity: ActivityDetail;
  detailsLoading: boolean;
}

export function StatsGrid({ activity, detailsLoading }: StatsGridProps) {
  const t = useTranslations('activities.detail');

  const activityType = activity.type.toUpperCase() as SportType;
  const isPaceMetric = activityType === SportType.Run || activityType === SportType.Swim;

  const primaryStats = [
    {
      label: t('stats.distance'),
      value: formatDistance(activity.distance),
      icon: Route,
    },
    {
      label: t('stats.duration'),
      value: formatDurationFull(activity.movingTime),
      icon: Timer,
      subValue: `${t('stats.elapsed')}: ${formatDurationFull(activity.elapsedTime)}`,
    },
    {
      label: t('stats.elevation'),
      value: formatElevation(activity.totalElevationGain),
      icon: TrendingUp,
    },
    {
      label: isPaceMetric ? t('stats.pace') : t('stats.speed'),
      value: formatPace(activity.distance, activity.movingTime, activityType),
      icon: Gauge,
    },
  ];

  const secondaryStats = [
    activity.averageHeartrate && {
      label: t('stats.avgHr'),
      value: `${Math.round(activity.averageHeartrate)} bpm`,
      icon: Heart,
    },
    activity.maxHeartrate && {
      label: t('stats.maxHr'),
      value: `${activity.maxHeartrate} bpm`,
      icon: Activity,
    },
    activity.averageCadence && {
      label: t('stats.cadence'),
      value: `${Math.round(activity.averageCadence)} spm`,
      icon: Footprints,
    },
    activity.elevHigh != null &&
      activity.elevLow != null && {
        label: t('stats.altitude'),
        value: formatAltitudeRange(activity.elevHigh, activity.elevLow),
        icon: Mountain,
      },
    activity.detailsFetched &&
      activity.calories && {
        label: t('stats.calories'),
        value: formatCalories(activity.calories),
        icon: Flame,
      },
    activity.averageWatts && {
      label: t('stats.power'),
      value: formatWatts(activity.averageWatts),
      icon: Zap,
      subValue: activity.weightedAverageWatts ? `NP: ${formatWatts(activity.weightedAverageWatts)}` : undefined,
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof Heart;
    subValue?: string;
  }>;

  const showCaloriesSkeleton = detailsLoading;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {primaryStats.map(stat => (
          <StatCard key={stat.label} {...stat} highlight />
        ))}
      </div>

      {(secondaryStats.length > 0 || showCaloriesSkeleton) && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {secondaryStats.map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
          {showCaloriesSkeleton && (
            <Card className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
