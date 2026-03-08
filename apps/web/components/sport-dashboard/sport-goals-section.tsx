'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Target, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { GoalCardFragment, SportType } from '@/gql/graphql';
import type { PrimaryGoal, BaseGoal } from '@/lib/dashboard/types';
import { getSportColors } from '@/lib/sports/config';
import { useSportGoals } from '@/lib/sport-dashboard/hooks/use-sport-goals';
import { PrimaryGoalCard } from '@/components/dashboard/goals-section/primary-goal-card';
import { SecondaryGoalCard } from '@/components/dashboard/goals-section/secondary-goal-card';

export interface SportGoalsSectionProps {
  sportType: SportType;
  className?: string;
}

function toBaseGoal(goal: GoalCardFragment): BaseGoal {
  return {
    id: goal.id,
    title: goal.title,
    targetType: goal.targetType,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    startDate: goal.startDate instanceof Date ? goal.startDate : new Date(String(goal.startDate)),
    endDate: goal.endDate instanceof Date ? goal.endDate : new Date(String(goal.endDate)),
    sportType: goal.sportType ?? null,
    status: goal.status,
    progressPercentage: goal.progressPercentage,
    daysRemaining: goal.daysRemaining ?? null,
    isExpired: goal.isExpired,
  };
}

function toPrimaryGoal(goal: GoalCardFragment): PrimaryGoal {
  return {
    ...toBaseGoal(goal),
    progressHistory: [],
  };
}

function SportGoalsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-52 w-full rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SportGoalsSection({ sportType, className }: SportGoalsSectionProps) {
  const t = useTranslations('sportDashboard.goals');
  const { primaryGoal, secondaryGoals, hasGoals, loading } = useSportGoals({ sportType });
  const sportColors = getSportColors(sportType);
  const sectionId = 'sport-goals-title';

  if (loading) {
    return <SportGoalsSkeleton />;
  }

  if (!hasGoals) {
    return (
      <section aria-labelledby={sectionId} className={cn(className)}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle id={sectionId} className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className={cn('p-3 rounded-full mb-4', sportColors.bgMuted)}>
                <Target className={cn('h-8 w-8', sportColors.text)} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t('empty.title')}</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">{t('empty.description')}</p>
              <Button asChild>
                <Link href="/goals/new">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('empty.cta')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby={sectionId} className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 id={sectionId} className="text-lg font-semibold">
          {t('title')}
        </h2>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link href={`/goals?sport=${sportType}`}>
            {t('viewAll')}
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {primaryGoal && <PrimaryGoalCard goal={toPrimaryGoal(primaryGoal)} sportColor={sportColors} />}

        {secondaryGoals.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {secondaryGoals.map(goal => (
              <SecondaryGoalCard key={goal.id} goal={toBaseGoal(goal)} sportColor={sportColors} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
