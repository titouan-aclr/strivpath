'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PersonalRecord, SportType } from '@/gql/graphql';
import { formatDate, formatDistance, formatDurationFull, formatElevation } from '@/lib/activities/formatters';
import { usePersonalRecords } from '@/lib/sport-dashboard/hooks/use-personal-records';
import { getSportColors, type SportColorConfig } from '@/lib/sports/config';
import { formatPaceFromSeconds, formatSpeed } from '@/lib/sports/formatters';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

interface RecordCardProps {
  record: PersonalRecord;
  sportColors: SportColorConfig;
  locale: string;
  sportType: SportType;
  t: (key: string, params?: Record<string, string>) => string;
}

function RecordCard({ record, sportColors, locale, sportType, t }: RecordCardProps) {
  const formattedValue = formatRecordValue(record.type, record.value, sportType, locale);
  const label = getRecordLabel(record.type, t);
  const formattedDate = formatDate(record.achievedAt, locale, 'short');

  return (
    <Link href={`/activities/${record.activityId}`} className="block">
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
              <p className="text-3xl font-bold tracking-tight truncate">{formattedValue}</p>
              <p className="text-xs text-muted-foreground">{t('achievedOn', { date: formattedDate })}</p>
            </div>
            <div className={cn('p-2.5 rounded-lg', sportColors.bgMuted)}>
              <Trophy className={cn('h-5 w-5', sportColors.text)} aria-hidden="true" />
            </div>
          </div>
        </CardContent>
      </Card>
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
          <div
            className={cn(
              'grid grid-cols-1 gap-4',
              records.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3',
            )}
          >
            {records.map(record => (
              <RecordCard
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
