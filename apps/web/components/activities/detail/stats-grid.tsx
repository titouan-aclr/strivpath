'use client';

import { useTranslations } from 'next-intl';
import { Route, Timer, TrendingUp, Gauge, Heart, Activity, Footprints, Mountain, Flame, Zap } from 'lucide-react';
import { StatCard } from './stat-card';
import {
  formatDistance,
  formatDuration,
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
}

export function StatsGrid({ activity }: StatsGridProps) {
  const t = useTranslations('activities.detail');

  const activityType = activity.type as SportType;
  const isPaceMetric = activityType === SportType.Run || activityType === SportType.Swim;

  const primaryStats = [
    {
      label: t('stats.distance'),
      value: formatDistance(activity.distance),
      icon: Route,
    },
    {
      label: t('stats.duration'),
      value: formatDuration(activity.movingTime),
      icon: Timer,
      subValue: `${t('stats.elapsed')}: ${formatDuration(activity.elapsedTime)}`,
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map(stat => (
          <StatCard key={stat.label} {...stat} highlight />
        ))}
      </div>

      {secondaryStats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryStats.map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}
    </div>
  );
}
