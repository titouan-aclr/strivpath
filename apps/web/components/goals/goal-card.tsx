'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { MoreVertical, Edit, Archive, Trash2, Footprints, Bike, Waves, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProgressBar } from './progress-bar';
import { GoalStatusBadge } from './goal-status-badge';
import { GoalDeleteDialog } from './goal-delete-dialog';
import { UNIT_LABELS } from './constants';
import { GoalTargetType, SportType } from '@/gql/graphql';
import type { GoalCardFragment } from '@/gql/graphql';

export interface GoalCardProps {
  goal: GoalCardFragment;
  onArchive: (goalId: string) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  disabled?: boolean;
}

export function GoalCard({ goal, onArchive, onDelete, disabled }: GoalCardProps) {
  const t = useTranslations('goals');
  const locale = useLocale();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const SportIcon = getSportIcon(goal.sportType);

  return (
    <>
      <Link href={`/goals/${goal.id}`} className="block">
        <Card className="transition-all hover:shadow-lg hover:border-strava-orange/50 cursor-pointer">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-strava-orange/10">
                <SportIcon className="h-5 w-5 text-strava-orange" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{goal.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {formatPeriod(goal.startDate, goal.endDate, locale)}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={disabled}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('actions.menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem asChild onClick={e => e.stopPropagation()}>
                  <Link href={`/goals/${goal.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('actions.edit')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    void onArchive(goal.id);
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {t('actions.archive')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="space-y-4">
            <ProgressBar
              current={goal.currentValue}
              target={goal.targetValue}
              unit={getUnitLabel(goal.targetType)}
              status={goal.status}
              percentage={goal.progressPercentage}
            />

            <div className="flex items-center justify-between text-sm">
              <GoalStatusBadge status={goal.status} />
              <span className="text-muted-foreground">{getDaysRemaining(goal.endDate, t)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      <GoalDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        goalTitle={goal.title}
        onConfirm={() => {
          void onDelete(goal.id);
          setShowDeleteDialog(false);
        }}
      />
    </>
  );
}

function getSportIcon(sportType: SportType | null | undefined) {
  if (sportType === SportType.Run) return Footprints;
  if (sportType === SportType.Ride) return Bike;
  if (sportType === SportType.Swim) return Waves;
  return Activity;
}

function formatPeriod(startDate: Date | string, endDate: Date | string, locale: string): string {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined,
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function getDaysRemaining(endDate: Date | string, t: (key: string, values?: Record<string, number>) => string): string {
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return t('daysRemaining.expired');
  if (diff === 0) return t('daysRemaining.today');
  if (diff === 1) return t('daysRemaining.tomorrow');
  return t('daysRemaining.days', { count: diff });
}

function getUnitLabel(targetType: GoalTargetType): string {
  return UNIT_LABELS[targetType];
}
