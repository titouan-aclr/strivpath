'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSwitch } from '@/components/dashboard/period-switch';
import { useSportProgression } from '@/lib/sport-dashboard/hooks/use-sport-progression';
import { StatisticsPeriod, type SportType } from '@/gql/graphql';
import { cn } from '@/lib/utils';
import { MetricSelector } from './metric-selector';
import { ProgressionChartDisplay } from './progression-chart-display';

export interface ProgressionChartSectionProps {
  sportType: SportType;
  className?: string;
}

export function ProgressionChartSection({ sportType, className }: ProgressionChartSectionProps) {
  const t = useTranslations('sportDashboard.progression');
  const { data, period, setPeriod, metric, setMetric, availableMetrics, loading } = useSportProgression({
    sportType,
  });

  const periodOptions = [
    { value: StatisticsPeriod.Week, label: t('periods.weekly') },
    { value: StatisticsPeriod.Month, label: t('periods.monthly') },
  ];

  const handlePeriodChange = (value: string) => {
    setPeriod(value as StatisticsPeriod);
  };

  if (loading) {
    return <ProgressionChartSkeleton />;
  }

  return (
    <section aria-labelledby="progression-chart-section-title" className={cn(className)}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle id="progression-chart-section-title" className="text-lg font-semibold">
                {t('title')}
              </CardTitle>
              <PeriodSwitch options={periodOptions} value={period} onChange={handlePeriodChange} />
            </div>
            <MetricSelector
              metrics={availableMetrics}
              activeMetric={metric}
              onMetricChange={setMetric}
              sportType={sportType}
            />
          </div>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ProgressionChartDisplay data={data} metric={metric} sportType={sportType} />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">{t('empty')}</div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ProgressionChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-9 w-48" />
          </div>
          <Skeleton className="h-8 w-64" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}
