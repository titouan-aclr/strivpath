'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Timer, Gauge, Heart, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSwitch } from '@/components/dashboard/period-switch';
import { StatCard } from '@/components/dashboard/stat-card';
import { useSportAverageMetrics } from '@/lib/sport-dashboard/hooks/use-sport-average-metrics';
import { getSportColors } from '@/lib/sports/config';
import { formatPaceFromSeconds, formatSpeed, formatHeartRate, formatCadence } from '@/lib/sports/formatters';
import { formatWatts } from '@/lib/activities/formatters';
import { StatisticsPeriod, SportType } from '@/gql/graphql';
import type { SportAverageMetrics } from '@/gql/graphql';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AverageMetricsSectionProps {
  sportType: SportType;
  className?: string;
}

interface MetricCard {
  label: string;
  value: string;
  icon: LucideIcon;
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

export function AverageMetricsSection({ sportType, className }: AverageMetricsSectionProps) {
  const t = useTranslations('sportDashboard.averageMetrics');
  const locale = useLocale();
  const { metrics, period, setPeriod, loading } = useSportAverageMetrics({ sportType });
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
    return <AverageMetricsSectionSkeleton />;
  }

  const metricCards = getMetricCards(sportType, metrics, locale, t);
  const gridClass = metricCards.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <section aria-labelledby="average-metrics-section-title" className={cn(className)}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle id="average-metrics-section-title" className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
            <PeriodSwitch options={periodOptions} value={period} onChange={handlePeriodChange} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn('grid grid-cols-1 gap-4', gridClass)}>
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
        </CardContent>
      </Card>
    </section>
  );
}

function AverageMetricsSectionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
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
