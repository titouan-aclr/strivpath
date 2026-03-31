'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Route, Clock, Activity, Mountain, Timer, Gauge, Heart, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSwitch } from '@/components/dashboard/period-switch';
import { StatCard } from '@/components/dashboard/stat-card';
import type { TrendInfo } from '@/components/dashboard/stat-card';
import { usePerformanceOverview } from '@/lib/sport-dashboard/hooks/use-performance-overview';
import { getSportColors } from '@/lib/sports/config';
import { formatDistance, formatElevation, formatWatts } from '@/lib/activities/formatters';
import { formatDurationCompact } from '@/lib/dashboard/utils';
import { formatPaceFromSeconds, formatSpeed, formatHeartRate, formatCadence } from '@/lib/sports/formatters';
import { StatisticsPeriod, SportType } from '@/gql/graphql';
import type { SportAverageMetrics } from '@/gql/graphql';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type PerformanceTab = 'volume' | 'averages';

export interface PerformanceOverviewSectionProps {
  sportType: SportType;
  className?: string;
}

interface MetricCard {
  label: string;
  value: string;
  icon: LucideIcon;
}

function buildTrendInfo(percentage: number | null | undefined): TrendInfo | undefined {
  if (percentage == null) return undefined;
  return {
    value: parseFloat(Math.abs(percentage).toFixed(1)),
    isPositive: percentage >= 0,
  };
}

function getMetricCards(
  sportType: SportType,
  metrics: SportAverageMetrics | null,
  locale: string,
  t: (key: string) => string,
): MetricCard[] {
  const cards: MetricCard[] = [];

  if (sportType === SportType.Ride) {
    cards.push({
      label: t('speed'),
      value: metrics ? formatSpeed(metrics.averageSpeed, locale) : '—',
      icon: Gauge,
    });
  } else {
    cards.push({
      label: t('pace'),
      value: metrics ? formatPaceFromSeconds(metrics.averagePace, sportType) : '—',
      icon: Timer,
    });
  }

  cards.push({
    label: t('heartRate'),
    value: metrics ? formatHeartRate(metrics.averageHeartRate) : '—',
    icon: Heart,
  });

  cards.push({
    label: t('cadence'),
    value: metrics ? formatCadence(metrics.averageCadence, sportType) : '—',
    icon: Activity,
  });

  if (sportType === SportType.Ride && metrics?.averagePower != null) {
    cards.push({
      label: t('power'),
      value: formatWatts(metrics.averagePower),
      icon: Zap,
    });
  }

  return cards;
}

const TABS: { value: PerformanceTab; key: string }[] = [
  { value: 'volume', key: 'tabs.volume' },
  { value: 'averages', key: 'tabs.averages' },
];

export function PerformanceOverviewSection({ sportType, className }: PerformanceOverviewSectionProps) {
  const tOverview = useTranslations('sportDashboard.performanceOverview');
  const tStats = useTranslations('sportDashboard.stats');
  const tMetrics = useTranslations('sportDashboard.averageMetrics');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<PerformanceTab>('volume');
  const { stats, metrics, period, setPeriod, loading, statsLoading, metricsLoading } = usePerformanceOverview({
    sportType,
  });
  const sportColors = getSportColors(sportType);

  const periodOptions = [
    { value: StatisticsPeriod.Week, label: tOverview('periods.week') },
    { value: StatisticsPeriod.Month, label: tOverview('periods.month') },
    { value: StatisticsPeriod.Year, label: tOverview('periods.year') },
  ];

  const handlePeriodChange = (value: string) => {
    setPeriod(value as StatisticsPeriod);
  };

  if (loading) {
    return <PerformanceOverviewSkeleton />;
  }

  const showElevation = sportType !== SportType.Swim;
  const volumeGridClass = showElevation ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';

  const metricCards = getMetricCards(sportType, metrics, locale, tMetrics);
  const averagesGridClass = metricCards.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <section aria-labelledby="performance-overview-title" className={cn(className)}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle id="performance-overview-title" className="text-lg font-semibold">
              {tOverview('title')}
            </CardTitle>
            <PeriodSwitch options={periodOptions} value={period} onChange={handlePeriodChange} />
          </div>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Performance view">
            {TABS.map(tab => {
              const isActive = tab.value === activeTab;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.value}`}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? `${sportColors.bgMuted} ${sportColors.text}`
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {tOverview(tab.key)}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'volume' && (
            <div id="panel-volume" role="tabpanel">
              {statsLoading && !stats ? (
                <TabContentSkeleton count={showElevation ? 4 : 3} />
              ) : (
                <div className={cn('grid grid-cols-1 gap-4', volumeGridClass)}>
                  <StatCard
                    label={tStats('distance')}
                    value={stats ? formatDistance(stats.totalDistance, locale) : '—'}
                    icon={Route}
                    trend={stats ? buildTrendInfo(stats.distanceTrend) : undefined}
                    sportColor={sportColors}
                  />
                  <StatCard
                    label={tStats('duration')}
                    value={stats ? formatDurationCompact(stats.totalDuration) : '—'}
                    icon={Clock}
                    trend={stats ? buildTrendInfo(stats.durationTrend) : undefined}
                    sportColor={sportColors}
                  />
                  <StatCard
                    label={tStats('sessions')}
                    value={stats != null ? stats.activityCount : '—'}
                    icon={Activity}
                    trend={stats ? buildTrendInfo(stats.activityTrend) : undefined}
                    sportColor={sportColors}
                  />
                  {showElevation && (
                    <StatCard
                      label={tStats('elevation')}
                      value={stats ? formatElevation(stats.totalElevation) : '—'}
                      icon={Mountain}
                      trend={stats ? buildTrendInfo(stats.elevationTrend) : undefined}
                      sportColor={sportColors}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'averages' && (
            <div id="panel-averages" role="tabpanel">
              {metricsLoading && !metrics ? (
                <TabContentSkeleton count={metricCards.length || 3} />
              ) : (
                <div className={cn('grid grid-cols-1 gap-4', averagesGridClass)}>
                  {metricCards.map(card => (
                    <StatCard
                      key={card.label}
                      label={card.label}
                      value={card.value}
                      icon={card.icon}
                      sportColor={sportColors}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function TabContentSkeleton({ count }: { count: number }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', count >= 4 && 'lg:grid-cols-4')}>
      {Array.from({ length: count }).map((_, i) => (
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
  );
}

function PerformanceOverviewSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-44" />
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
