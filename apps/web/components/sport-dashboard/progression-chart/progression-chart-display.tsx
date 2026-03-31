'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { IntervalType, type ProgressionDataPoint, type ProgressionMetric, type SportType } from '@/gql/graphql';
import { getSportColors } from '@/lib/sports/config';
import { getIntervalLabel, formatProgressionValue, formatProgressionYAxis } from './chart-label-utils';
import { cn } from '@/lib/utils';

export interface ProgressionChartDisplayProps {
  data: ProgressionDataPoint[];
  metric: ProgressionMetric;
  sportType: SportType;
  className?: string;
}

export function ProgressionChartDisplay({ data, metric, sportType, className }: ProgressionChartDisplayProps) {
  const locale = useLocale();
  const sportColors = getSportColors(sportType);
  const chartColor = sportColors.chart;

  const chartData = useMemo(
    () =>
      data.map(point => ({
        label: getIntervalLabel(point.index, point.intervalType, locale),
        value: point.value,
      })),
    [data, locale],
  );

  const chartConfig: ChartConfig = {
    progression: {
      label: 'Progression',
      color: chartColor,
    },
  };

  const isWeeklyGranularity = data[0]?.intervalType === IntervalType.Week;

  return (
    <ChartContainer config={chartConfig} className={cn('h-[300px] w-full', className)}>
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          {...(isWeeklyGranularity ? { interval: 'preserveStartEnd' } : {})}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: number) => formatProgressionYAxis(value, metric)}
          width={40}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={value => formatProgressionValue(value as number, metric, locale, sportType)}
            />
          }
        />
        <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
