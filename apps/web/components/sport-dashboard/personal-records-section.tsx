'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PersonalRecord, SportType } from '@/gql/graphql';
import { formatDate, formatDistance, formatDurationFull, formatElevation } from '@/lib/activities/formatters';
import { usePersonalRecords } from '@/lib/sport-dashboard/hooks/use-personal-records';
import { getSportColors, type SportColorConfig } from '@/lib/sports/config';
import { formatPaceFromSeconds, formatSpeed } from '@/lib/sports/formatters';
import { cn } from '@/lib/utils';
import { Trophy, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export interface PersonalRecordsSectionProps {
  sportType: SportType;
  className?: string;
}

function formatRecordValue(type: string, value: number, sportType: SportType, locale: string): string {
  if (type === 'longest_distance') return formatDistance(value, locale);
  if (type === 'longest_duration') return formatDurationFull(value);
  if (type === 'most_elevation') return formatElevation(value);
  if (type === 'best_pace') return formatPaceFromSeconds(value, sportType);
  if (type === 'best_speed') return formatSpeed(value, locale);
  return String(value);
}

function getRecordLabel(type: string, t: (key: string) => string): string {
  if (type === 'longest_distance') return t('types.longest_distance');
  if (type === 'longest_duration') return t('types.longest_duration');
  if (type === 'most_elevation') return t('types.most_elevation');
  if (type === 'best_pace') return t('types.best_pace');
  if (type === 'best_speed') return t('types.best_speed');
  return type;
}

function PersonalRecordsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-28" />
              <div className="ml-auto flex items-center gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-24 hidden sm:block" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface RecordRowProps {
  record: PersonalRecord;
  sportColors: SportColorConfig;
  locale: string;
  sportType: SportType;
  t: (key: string, params?: Record<string, string>) => string;
}

function RecordRow({ record, sportColors, locale, sportType, t }: RecordRowProps) {
  const formattedValue = formatRecordValue(record.type, record.value, sportType, locale);
  const label = getRecordLabel(record.type, t);
  const formattedDate = formatDate(record.achievedAt, locale, 'short');

  return (
    <Link
      href={`/activities/${record.activityId}`}
      className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-md group"
    >
      <div className={cn('p-2 rounded-lg shrink-0', sportColors.bgMuted)}>
        <Trophy className={cn('h-4 w-4', sportColors.text)} aria-hidden="true" />
      </div>
      <span className="font-medium text-sm truncate min-w-0">{label}</span>
      <div className="ml-auto flex items-center gap-4 shrink-0">
        <span className={cn('font-semibold text-sm', sportColors.text)}>{formattedValue}</span>
        <span className="text-xs text-muted-foreground hidden sm:block">{formattedDate}</span>
        <ChevronRight
          className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

export function PersonalRecordsSection({ sportType, className }: PersonalRecordsSectionProps) {
  const t = useTranslations('sportDashboard.records');
  const locale = useLocale();
  const { records, loading } = usePersonalRecords({ sportType });
  const sportColors = getSportColors(sportType);
  const sectionId = 'personal-records-title';

  if (loading) {
    return <PersonalRecordsSkeleton />;
  }

  if (records.length === 0) {
    return (
      <section aria-labelledby={sectionId} className={cn(className)}>
        <Card>
          <CardHeader>
            <CardTitle id={sectionId} className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-6">{t('empty')}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby={sectionId} className={cn(className)}>
      <Card>
        <CardHeader>
          <CardTitle id={sectionId} className="text-lg font-semibold">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {records.map(record => (
              <RecordRow
                key={record.type}
                record={record}
                sportColors={sportColors}
                locale={locale}
                sportType={sportType}
                t={t}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
