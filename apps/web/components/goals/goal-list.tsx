'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Target, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoalCard } from './goal-card';
import { GoalListSkeleton } from './goal-list-skeleton';
import type { GoalCardFragment } from '@/gql/graphql';

export interface GoalListProps {
  goals: GoalCardFragment[];
  loading: boolean;
  error?: Error;
  onArchive: (goalId: string) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
  onRefetch: () => void;
  isArchiving: boolean;
  isDeleting: boolean;
}

export function GoalList({
  goals,
  loading,
  error,
  onArchive,
  onDelete,
  onRefetch,
  isArchiving,
  isDeleting,
}: GoalListProps) {
  const t = useTranslations('goals');

  if (loading && goals.length === 0) {
    return <GoalListSkeleton count={6} />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-medium text-destructive mb-1">{t('error.title')}</p>
              <p className="text-sm text-muted-foreground">{t('error.description')}</p>
            </div>
            <Button onClick={onRefetch} variant="outline" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('error.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loading && goals.length === 0) {
    return (
      <Card className="text-center p-12">
        <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <CardTitle className="mb-2">{t('empty.title')}</CardTitle>
        <CardDescription className="mb-6">{t('empty.description')}</CardDescription>
        <Button asChild>
          <Link href="/goals/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('empty.createButton')}
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onArchive={onArchive}
          onDelete={onDelete}
          disabled={isArchiving || isDeleting}
        />
      ))}
    </div>
  );
}
