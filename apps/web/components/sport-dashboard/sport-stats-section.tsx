'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Route, Clock, Activity, Mountain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSwitch } from '@/components/dashboard/period-switch';
import { StatCard } from '@/components/dashboard/stat-card';
import type { TrendInfo } from '@/components/dashboard/stat-card';
import { useSportStats } from '@/lib/sport-dashboard/hooks/use-sport-stats';
import { getSportColors } from '@/lib/sports/config';
import { formatDistance, formatElevation } from '@/lib/activities/formatters';
import { formatDurationCompact } from '@/lib/dashboard/utils';
import { StatisticsPeriod, SportType } from '@/gql/graphql';
import { cn } from '@/lib/utils';

export interface SportStatsSectionProps {
  sportType: SportType;
  className?: string;
}

function buildTrendInfo(percentage: number | null | undefined): TrendInfo | undefined {
  if (percentage == null) return undefined;
  return {
    value: parseFloat(Math.abs(percentage).toFixed(1)),
    isPositive: percentage >= 0,
  };
}

export function SportStatsSection({ sportType, className }: SportStatsSectionProps) {
  const t = useTranslations('sportDashboard.stats');
  const locale = useLocale();
  const { stats, period, setPeriod, loading } = useSportStats({ sportType });
  const sportColors = getSportColors(sportType);

  const periodOptions = [
    { value: StatisticsPeriod.Week, label: t('periods.week') },
    { value: StatisticsPeriod.Month, label: t('periods.month') },
    { value: StatisticsPeriod.Year, label: t('periods.year') },
  ];

  const handlePeriodChange = (value: string) => {
    setPeriod(value as StatisticsPeriod);
  };

  if (loading) {
    return <SportStatsSectionSkeleton />;
  }

  const showElevation = sportType !== SportType.Swim;
  const gridClass = showElevation ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <section aria-labelledby="sport-stats-section-title" className={cn(className)}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle id="sport-stats-section-title" className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
            <PeriodSwitch options={periodOptions} value={period} onChange={handlePeriodChange} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn('grid grid-cols-1 gap-4', gridClass)}>
            <StatCard
              label={t('distance')}
              value={stats ? formatDistance(stats.totalDistance, locale) : '—'}
              icon={Route}
              trend={stats ? buildTrendInfo(stats.distanceTrend) : undefined}
              sportColor={sportColors}
            />
            <StatCard
              label={t('duration')}
              value={stats ? formatDurationCompact(stats.totalDuration) : '—'}
              icon={Clock}
              trend={stats ? buildTrendInfo(stats.durationTrend) : undefined}
              sportColor={sportColors}
            />
            <StatCard
              label={t('sessions')}
              value={stats != null ? stats.activityCount : '—'}
              icon={Activity}
              trend={stats ? buildTrendInfo(stats.activityTrend) : undefined}
              sportColor={sportColors}
            />
            {showElevation && (
              <StatCard
                label={t('elevation')}
                value={stats ? formatElevation(stats.totalElevation) : '—'}
                icon={Mountain}
                trend={stats ? buildTrendInfo(stats.elevationTrend) : undefined}
                sportColor={sportColors}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function SportStatsSectionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
