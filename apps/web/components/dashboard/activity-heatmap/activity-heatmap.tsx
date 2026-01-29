'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ActivityCalendarDay } from '@/lib/dashboard/types';

export interface ActivityHeatmapProps {
  calendarData: ActivityCalendarDay[];
  year?: number;
  className?: string;
}

interface WeekData {
  weekIndex: number;
  days: DayData[];
}

interface DayData {
  date: Date;
  hasActivity: boolean;
  isCurrentYear: boolean;
}

const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getFirstMondayOfYear(year: number): Date {
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  const firstMonday = new Date(year, 0, 1 + daysUntilMonday);

  if (firstMonday.getFullYear() > year) {
    return new Date(year - 1, 11, 31 - (dayOfWeek - 2));
  }

  if (dayOfWeek !== 1) {
    firstMonday.setDate(firstMonday.getDate() - 7);
  }

  return firstMonday;
}

function buildYearGrid(year: number, calendarData: ActivityCalendarDay[]): WeekData[] {
  const activityDates = new Set(
    calendarData
      .filter(d => d.hasActivity)
      .map(d => (d.date instanceof Date ? d.date : new Date(d.date)).toISOString().split('T')[0]),
  );

  const weeks: WeekData[] = [];
  const firstMonday = getFirstMondayOfYear(year);
  const yearEnd = new Date(year, 11, 31);

  const currentDate = new Date(firstMonday);
  let weekIndex = 0;

  while (currentDate <= yearEnd || weeks.length < 53) {
    const weekDays: DayData[] = [];

    for (let dayInWeek = 0; dayInWeek < DAYS_IN_WEEK; dayInWeek++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isCurrentYear = currentDate.getFullYear() === year;

      weekDays.push({
        date: new Date(currentDate),
        hasActivity: activityDates.has(dateStr),
        isCurrentYear,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    weeks.push({
      weekIndex,
      days: weekDays,
    });

    weekIndex++;

    if (weekIndex > 52 && currentDate.getFullYear() > year) {
      break;
    }
  }

  return weeks;
}

function formatDateForTooltip(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ActivityHeatmap({ calendarData, year: initialYear, className }: ActivityHeatmapProps) {
  const t = useTranslations('dashboard.heatmap');

  const year = initialYear ?? new Date().getFullYear();

  const weeks = useMemo(() => buildYearGrid(year, calendarData), [year, calendarData]);

  const activityCount = useMemo(() => {
    return calendarData.filter(d => {
      const date = d.date instanceof Date ? d.date : new Date(d.date);
      return d.hasActivity && date.getFullYear() === year;
    }).length;
  }, [calendarData, year]);

  const monthLabels = useMemo(() => {
    const labels: { month: string; startWeek: number }[] = [];
    const months = new Map<number, number>();

    weeks.forEach((week, weekIdx) => {
      const firstDayOfMonth = week.days.find(d => d.isCurrentYear && d.date.getDate() <= 7);
      if (firstDayOfMonth && !months.has(firstDayOfMonth.date.getMonth())) {
        months.set(firstDayOfMonth.date.getMonth(), weekIdx);
      }
    });

    months.forEach((startWeek, month) => {
      labels.push({
        month: new Date(year, month, 1).toLocaleDateString('en', { month: 'short' }),
        startWeek,
      });
    });

    return labels.sort((a, b) => a.startWeek - b.startWeek);
  }, [weeks, year]);

  return (
    <Card className={cn('overflow-hidden h-full flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <div className="p-2 rounded-lg bg-strava-orange/10">
          <Calendar className="h-4 w-4 text-strava-orange" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="text-base font-medium">{t('title')}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('totalActivities', { count: activityCount })} {t('thisYear')}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-center">
        <TooltipProvider delayDuration={100}>
          <div className="space-y-2">
            <div className="flex gap-[3px] text-xs text-muted-foreground pl-6">
              {monthLabels.map((label, idx) => (
                <div
                  key={`${label.month}-${idx}`}
                  className="flex-shrink-0"
                  style={{
                    marginLeft: idx === 0 ? `${label.startWeek * 13}px` : undefined,
                    width: `${((monthLabels[idx + 1]?.startWeek ?? weeks.length) - label.startWeek) * 13 - 3}px`,
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pr-1 pt-[2px]">
                {DAY_LABELS.map((label, idx) => (
                  <div key={idx} className="h-[10px] leading-[10px]">
                    {idx % 2 === 0 ? label : ''}
                  </div>
                ))}
              </div>

              <div className="flex gap-[3px] overflow-x-auto">
                {weeks.map(week => (
                  <div key={week.weekIndex} className="flex flex-col gap-[3px]">
                    {week.days.map((day, dayIdx) => {
                      const isToday = day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

                      return (
                        <Tooltip key={dayIdx}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-[10px] h-[10px] rounded-[2px] transition-colors',
                                !day.isCurrentYear && 'opacity-30',
                                day.hasActivity
                                  ? 'bg-strava-orange hover:bg-strava-orange/80'
                                  : 'bg-muted hover:bg-muted-foreground/20',
                                isToday && 'ring-1 ring-offset-1 ring-foreground/50',
                              )}
                              aria-label={day.hasActivity ? t('legend.withActivity') : t('legend.noActivity')}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p>{formatDateForTooltip(day.date, 'en')}</p>
                            <p className="text-muted-foreground">
                              {day.hasActivity ? t('legend.withActivity') : t('legend.noActivity')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground pt-2">
              <span>{t('legend.noActivity')}</span>
              <div className="flex items-center gap-[2px]">
                <div className="w-[10px] h-[10px] rounded-[2px] bg-muted" />
                <div className="w-[10px] h-[10px] rounded-[2px] bg-strava-orange" />
              </div>
              <span>{t('legend.withActivity')}</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
