'use client';

import { useTranslations } from 'next-intl';
import { Clock, Activity, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSwitch } from './period-switch';
import { StatCard } from './stat-card';
import { StatisticsPeriod } from '@/lib/dashboard/types';
import { formatDurationCompact, formatAverageSessionTime } from '@/lib/dashboard/utils';
import type { PeriodStats } from '@/lib/dashboard/types';

export interface StatsSectionProps {
  statistics: PeriodStats | null;
  period: StatisticsPeriod;
  onPeriodChange: (period: StatisticsPeriod) => void;
  loading?: boolean;
}

export function StatsSection({ statistics, period, onPeriodChange, loading }: StatsSectionProps) {
  const t = useTranslations('dashboard.stats');

  const periodOptions = [
    { value: StatisticsPeriod.Week, label: t('periods.week') },
    { value: StatisticsPeriod.Month, label: t('periods.month') },
    { value: StatisticsPeriod.Year, label: t('periods.year') },
  ];

  const handlePeriodChange = (value: string) => {
    onPeriodChange(value as StatisticsPeriod);
  };

  if (loading) {
    return <StatsSectionSkeleton />;
  }

  return (
    <section aria-labelledby="stats-section-title">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle id="stats-section-title" className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
            <PeriodSwitch options={periodOptions} value={period} onChange={handlePeriodChange} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={t('totalTime')}
              value={statistics ? formatDurationCompact(statistics.totalTime) : '—'}
              icon={Clock}
            />
            <StatCard label={t('activityCount')} value={statistics?.activityCount ?? 0} icon={Activity} />
            <StatCard
              label={t('averageTime')}
              value={statistics ? formatAverageSessionTime(statistics.averageTimePerSession) : '—'}
              icon={Timer}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function StatsSectionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-24" />
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
