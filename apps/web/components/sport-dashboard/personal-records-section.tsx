'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SportType, PersonalRecord } from '@/gql/graphql';
import { getSportColors, type SportColorConfig } from '@/lib/sports/config';
import { usePersonalRecords } from '@/lib/sport-dashboard/hooks/use-personal-records';
import { formatDistance, formatDurationFull, formatElevation, formatDate } from '@/lib/activities/formatters';
import { formatPaceFromSeconds, formatSpeed } from '@/lib/sports/formatters';

export interface PersonalRecordsSectionProps {
  sportType: SportType;
  className?: string;
}

function formatRecordValue(type: string, value: number, sportType: SportType, locale: string): string {
  if (type.startsWith('longest_distance')) return formatDistance(value, locale);
  if (type.startsWith('longest_duration')) return formatDurationFull(value);
  if (type.startsWith('highest_elevation') || type.startsWith('most_elevation')) return formatElevation(value);
  if (type.startsWith('best_pace')) return formatPaceFromSeconds(value, sportType);
  if (type.startsWith('best_average_speed') || type.startsWith('best_speed')) return formatSpeed(value, locale);
  return String(value);
}

function getRecordLabel(type: string, t: (key: string) => string): string {
  if (type.startsWith('longest_distance')) return t('types.longest_distance');
  if (type.startsWith('longest_duration')) return t('types.longest_duration');
  if (type.startsWith('highest_elevation') || type.startsWith('most_elevation')) return t('types.most_elevation');
  if (type.startsWith('best_pace')) return t('types.best_pace');
  if (type.startsWith('best_average_speed') || type.startsWith('best_speed')) return t('types.best_speed');
  return type;
}

function PersonalRecordsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
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
      <Card className="transition-all hover:shadow-md cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className={cn('p-2 rounded-lg w-fit', sportColors.bgMuted)}>
            <Trophy className={cn('h-4 w-4', sportColors.text)} aria-hidden="true" />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-bold truncate">{formattedValue}</p>
            <p className="text-xs text-muted-foreground">{t('achievedOn', { date: formattedDate })}</p>
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
    <section aria-labelledby={sectionId} className={cn('space-y-4', className)}>
      <h2 id={sectionId} className="text-lg font-semibold">
        {t('title')}
      </h2>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
    </section>
  );
}
