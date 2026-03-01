'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalFilters } from './goal-filters';
import { GoalList } from './goal-list';
import { useGoals } from '@/lib/goals/use-goals';
import { useArchiveGoal, useDeleteGoal } from '@/lib/goals/use-goal-mutations';
import { GoalFilter, DEFAULT_FILTER } from '@/lib/goals/types';
import { GoalOrderBy, OrderDirection } from '@/components/goals/constants';

export function GoalsPageContent() {
  const t = useTranslations('goals');
  const [filter, setFilter] = useState<GoalFilter>(DEFAULT_FILTER);

  const {
    goals: rawGoals,
    loading,
    error,
    refetch,
  } = useGoals({
    status: filter.status ?? undefined,
    sportType: filter.sportType ?? undefined,
  });

  const { archiveGoal, loading: isArchiving } = useArchiveGoal();
  const { deleteGoal, loading: isDeleting } = useDeleteGoal();

  const filteredGoals = useMemo(() => {
    let result = [...rawGoals];

    if (filter.periodType) {
      result = result.filter(goal => goal.periodType === filter.periodType);
    }

    if (filter.targetType) {
      result = result.filter(goal => goal.targetType === filter.targetType);
    }

    return result;
  }, [rawGoals, filter.periodType, filter.targetType]);

  const sortedGoals = useMemo(() => {
    const goals = [...filteredGoals];

    if (!filter.orderBy) return goals;

    goals.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (filter.orderBy) {
        case GoalOrderBy.PROGRESS:
          aValue = a.progressPercentage;
          bValue = b.progressPercentage;
          break;
        case GoalOrderBy.DEADLINE:
          aValue = new Date(a.endDate).getTime();
          bValue = new Date(b.endDate).getTime();
          break;
        case GoalOrderBy.CREATED:
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (aValue < bValue) return filter.orderDirection === OrderDirection.ASC ? -1 : 1;
      if (aValue > bValue) return filter.orderDirection === OrderDirection.ASC ? 1 : -1;
      return 0;
    });

    return goals;
  }, [filteredGoals, filter.orderBy, filter.orderDirection]);

  const handleArchive = useCallback(
    async (goalId: string) => {
      const numericId = parseInt(goalId, 10);
      if (isNaN(numericId)) {
        console.error('Invalid goal ID:', goalId);
        return;
      }
      await archiveGoal(numericId);
    },
    [archiveGoal],
  );

  const handleDelete = useCallback(
    async (goalId: string) => {
      const numericId = parseInt(goalId, 10);
      if (isNaN(numericId)) {
        console.error('Invalid goal ID:', goalId);
        return;
      }
      await deleteGoal(numericId);
    },
    [deleteGoal],
  );

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>
        <Button asChild size="default" className="shrink-0">
          <Link href="/goals/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('newGoal')}
          </Link>
        </Button>
      </div>

      <GoalFilters filter={filter} onFilterChange={setFilter} />

      <GoalList
        goals={sortedGoals}
        loading={loading}
        error={error}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onRefetch={handleRefetch}
        isArchiving={isArchiving}
        isDeleting={isDeleting}
      />
    </div>
  );
}
