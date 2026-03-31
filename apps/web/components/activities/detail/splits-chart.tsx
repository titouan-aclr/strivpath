'use client';

import { useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { prepareSplitsForChart, formatPaceValue } from '@/lib/activities/splits-utils';
import { SportType } from '@/gql/graphql';
import type { ActivityDetail } from '@/lib/activities/activity-types';

interface SplitsChartProps {
  activity: ActivityDetail;
}

export function SplitsChart({ activity }: SplitsChartProps) {
  const t = useTranslations('activities.detail');

  if (!activity.detailsFetched) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('splits.title')}</CardTitle>
          <CardDescription>{t('splits.loading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!activity.splits || activity.splits.length === 0) {
    return null;
  }

  const activityType = activity.type.toUpperCase() as SportType;
  const chartData = prepareSplitsForChart(activity.splits, activityType);
  const isPaceMetric = activityType === SportType.Run || activityType === SportType.Swim;

  const chartConfig = {
    pace: {
      label: isPaceMetric ? t('splits.paceLabel') : t('splits.speedLabel'),
      color: 'oklch(0.65 0.19 245)',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('splits.title')}</CardTitle>
        <CardDescription>{t('splits.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="km"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              padding={{ left: 0 }}
              tickFormatter={value => `${value}km`}
            />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tickFormatter={(value: number) => (isPaceMetric ? formatPaceValue(value) : `${value.toFixed(1)}`)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={value => `${t('splits.kmLabel')} ${value}`}
                  formatter={value => [
                    isPaceMetric ? formatPaceValue(Number(value)) : `${Number(value).toFixed(1)} km/h`,
                    chartConfig.pace.label,
                  ]}
                />
              }
            />
            <defs>
              <linearGradient id="fillPace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pace)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-pace)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="pace"
              type="natural"
              fill="url(#fillPace)"
              fillOpacity={0.4}
              stroke="var(--color-pace)"
              strokeWidth={3}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
