'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PrimaryGoal, SecondaryGoal } from '@/lib/dashboard/types';
import { PrimaryGoalCard } from './primary-goal-card';
import { SecondaryGoalCard } from './secondary-goal-card';
import { GoalsEmptyState } from './goals-empty-state';

export interface GoalsSectionProps {
  primaryGoal: PrimaryGoal | null;
  secondaryGoals: SecondaryGoal[];
  className?: string;
}

export function GoalsSection({ primaryGoal, secondaryGoals, className }: GoalsSectionProps) {
  const t = useTranslations('dashboard.goals');

  if (!primaryGoal && secondaryGoals.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalsEmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/goals">
            {t('viewAll')}
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {primaryGoal && <PrimaryGoalCard goal={primaryGoal} />}

        {secondaryGoals.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {secondaryGoals.map(goal => (
              <SecondaryGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
