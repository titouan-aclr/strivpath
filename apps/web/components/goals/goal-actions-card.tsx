'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useArchiveGoal, useDeleteGoal } from '@/lib/goals/use-goal-mutations';
import { GoalStatus } from '@/gql/graphql';

interface GoalActionsCardProps {
  goalId: number;
  status: GoalStatus;
}

export function GoalActionsCard({ goalId, status }: GoalActionsCardProps) {
  const t = useTranslations('goals.detail.actions');

  const { archiveGoal, loading: archiving } = useArchiveGoal();
  const { deleteGoal, loading: deleting } = useDeleteGoal();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleArchive = () => {
    void archiveGoal(goalId);
  };

  const handleDelete = () => {
    void deleteGoal(goalId);
  };

  const canArchive = status === GoalStatus.Active;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="w-full" disabled title={t('editComingSoon')}>
          <Edit className="mr-2 h-4 w-4" />
          {t('edit')}
        </Button>

        <Button onClick={handleArchive} variant="outline" className="w-full" disabled={archiving || !canArchive}>
          <Archive className="mr-2 h-4 w-4" />
          {t('archive')}
        </Button>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteConfirm.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('deleteConfirm.description')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('deleteConfirm.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('deleteConfirm.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
