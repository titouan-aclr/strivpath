'use client';

import { useId, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { GoalProgressPoint } from '@/lib/dashboard/types';
import { GoalStatus } from '@/gql/graphql';
import { getGoalStatusColors, CHART_TARGET_LINE_COLOR } from '@/components/goals/constants';

export interface GoalProgressChartProps {
  progressHistory: GoalProgressPoint[];
  targetValue: number;
  startDate: Date | string;
  endDate: Date | string;
  unit: string;
  className?: string;
  status?: GoalStatus;
  colorHex?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  value: number | null;
  target: number;
}

export function GoalProgressChart({
  progressHistory,
  targetValue,
  startDate,
  endDate,
  unit,
  className,
  status,
  colorHex,
}: GoalProgressChartProps) {
  const locale = useLocale();
  const t = useTranslations('dashboard.goals.chart');
  const gradientId = useId();
  const progressColor = colorHex ?? getGoalStatusColors(status).hex;

  const chartConfig = {
    progress: {
      label: t('progress'),
      color: progressColor,
    },
    target: {
      label: t('target'),
      color: CHART_TARGET_LINE_COLOR,
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const sortedHistory = [...progressHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dateFormatter = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    });

    const dataMap = new Map<string, number>();

    for (const point of sortedHistory) {
      const pointDate = typeof point.date === 'string' ? new Date(point.date) : point.date;
      if (pointDate >= start && pointDate <= today) {
        const dateKey = pointDate.toISOString().split('T')[0];
        dataMap.set(dateKey, point.value);
      }
    }

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const data: ChartDataPoint[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    let lastKnownValue = 0;

    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0];
      const isInPast = current <= today;

      if (dataMap.has(dateKey)) {
        lastKnownValue = dataMap.get(dateKey)!;
      }

      const isKeyDate =
        dataMap.has(dateKey) ||
        current.getTime() === new Date(start).setHours(0, 0, 0, 0) ||
        current.getTime() === new Date(end).setHours(0, 0, 0, 0) ||
        (isInPast && isSameDay(current, today));

      if (isKeyDate) {
        data.push({
          date: dateKey,
          displayDate: dateFormatter.format(current),
          value: isInPast ? lastKnownValue : null,
          target: targetValue,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    if (data.length === 0) {
      data.push({
        date: start.toISOString().split('T')[0],
        displayDate: dateFormatter.format(start),
        value: 0,
        target: targetValue,
      });
    }

    return data;
  }, [progressHistory, targetValue, startDate, endDate, locale]);

  const yAxisMax = Math.max(
    targetValue * 1.1,
    ...chartData.filter(d => d.value !== null).map(d => (d.value as number) * 1.1),
  );

  return (
    <ChartContainer config={chartConfig} className={className}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 0,
          right: 12,
          top: 12,
          bottom: 0,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="displayDate"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
          domain={[0, yAxisMax]}
          tickFormatter={(value: number) => formatYAxisValue(value, unit)}
          width={40}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(value, name) => [
                formatTooltipValue(Number(value), unit),
                name === 'progress' ? chartConfig.progress.label : chartConfig.target.label,
              ]}
            />
          }
        />
        <ReferenceLine
          y={targetValue}
          stroke={CHART_TARGET_LINE_COLOR}
          strokeDasharray="8 4"
          strokeWidth={2}
          label={{
            value: `${formatYAxisValue(targetValue, unit)}`,
            position: 'insideTopRight',
            fill: CHART_TARGET_LINE_COLOR,
            fontSize: 10,
            offset: 5,
          }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={progressColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={progressColor} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="monotone"
          fill={`url(#${gradientId})`}
          fillOpacity={0.4}
          stroke={progressColor}
          strokeWidth={2}
          name="progress"
        />
      </AreaChart>
    </ChartContainer>
  );
}

function formatYAxisValue(value: number, unit: string): string {
  if (unit === 'km') {
    return `${value.toFixed(0)}`;
  }
  if (unit === 'hours') {
    return `${value.toFixed(0)}h`;
  }
  if (unit === 'meters') {
    return `${value.toFixed(0)}`;
  }
  return value.toFixed(0);
}

function formatTooltipValue(value: number, unit: string): string {
  if (unit === 'km') {
    return `${value.toFixed(1)} km`;
  }
  if (unit === 'hours') {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (unit === 'meters') {
    return `${value.toFixed(0)} m`;
  }
  if (unit === 'sessions') {
    return `${value.toFixed(0)} sessions`;
  }
  return value.toFixed(1);
}
