'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SportDistributionItem } from '@/lib/dashboard/types';
import { formatDurationCompact } from '@/lib/dashboard/utils';
import { getSportColors, getSportIcon } from '@/lib/sports/config';
import { cn } from '@/lib/utils';
import { PieChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export interface SportDistributionProps {
  distribution: SportDistributionItem[];
  className?: string;
}

export function SportDistribution({ distribution, className }: SportDistributionProps) {
  const t = useTranslations('dashboard.sportDistribution');
  const tSports = useTranslations('activities.sportTypes');

  const sortedDistribution = useMemo(
    () => [...distribution].sort((a, b) => b.percentage - a.percentage),
    [distribution],
  );

  const totalTime = useMemo(() => distribution.reduce((sum, item) => sum + item.totalTime, 0), [distribution]);

  if (distribution.length <= 1) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden h-full flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
        <div className="p-2 rounded-lg bg-strava-orange/10">
          <PieChart className="h-4 w-4 text-strava-orange" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="text-base font-medium">{t('title')}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{t('thisMonth')}</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {sortedDistribution.map(item => {
            const SportIcon = getSportIcon(item.sport);
            const sportColors = getSportColors(item.sport);
            const sportKey = item.sport.toLowerCase() as 'run' | 'ride' | 'swim';
            const sportLabel = tSports(sportKey) || item.sport;

            return (
              <div key={item.sport} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-md', sportColors.bgMuted)}>
                      <SportIcon className={cn('h-4 w-4', sportColors.text)} aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium">{sportLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{formatDurationCompact(item.totalTime)}</span>
                    <span className="font-medium tabular-nums w-12 text-right">{item.percentage.toFixed(0)}%</span>
                  </div>
                </div>

                <div
                  className="h-2 bg-muted rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={item.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', sportColors.bg)}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatDurationCompact(totalTime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
