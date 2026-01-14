'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import type { Goal } from '@/gql/graphql';
import { formatValueOnly, getProgressColorForChart, getUnitLabel } from '@/lib/goals/formatting';
import { useTranslations } from 'next-intl';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

interface GoalProgressCardProps {
  goal: Goal;
}

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const t = useTranslations('goals.detail');

  const unit = getUnitLabel(goal.targetType);
  const currentValue = formatValueOnly(goal.currentValue, goal.targetType);
  const targetValue = formatValueOnly(goal.targetValue, goal.targetType);

  const chartData = [
    {
      progress: goal.progressPercentage,
      fill: 'var(--color-progress)',
    },
  ];

  const chartConfig = {
    progress: {
      label: 'Progress',
      color: getProgressColorForChart(goal.status),
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('progress')}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[250px]">
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={360 * (goal.progressPercentage / 100) + 90}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="progress" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-4xl font-bold">
                          {Math.round(goal.progressPercentage)}%
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          {currentValue} / {targetValue} {unit}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
