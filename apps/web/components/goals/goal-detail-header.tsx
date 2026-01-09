'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { MoreVertical, Edit, Archive, Trash2 } from 'lucide-react';
import type { Goal } from '@/gql/graphql';
import { GoalStatus } from '@/gql/graphql';
import { getSportIcon } from '@/lib/goals/formatting';
import { GoalStatusBadge } from './goal-status-badge';
import { GoalDeleteDialog } from './goal-delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useArchiveGoal, useDeleteGoal } from '@/lib/goals/use-goal-mutations';

interface GoalDetailHeaderProps {
  goal: Goal;
}

export function GoalDetailHeader({ goal }: GoalDetailHeaderProps) {
  const t = useTranslations('goals');
  const router = useRouter();
  const SportIcon = getSportIcon(goal.sportType);

  const { archiveGoal, loading: archiving } = useArchiveGoal();
  const { deleteGoal } = useDeleteGoal();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleArchive = () => {
    const numericId = parseInt(goal.id, 10);
    if (isNaN(numericId)) {
      console.error('Invalid goal ID:', goal.id);
      return;
    }
    void archiveGoal(numericId);
  };

  const handleDelete = () => {
    const numericId = parseInt(goal.id, 10);
    if (isNaN(numericId)) {
      console.error('Invalid goal ID:', goal.id);
      return;
    }
    void deleteGoal(numericId);
    setShowDeleteDialog(false);
  };

  const handleEdit = () => {
    router.push(`/goals/${goal.id}/edit`);
  };

  const canEdit = goal.status === GoalStatus.Active;
  const canArchive = goal.status === GoalStatus.Active;

  return (
    <>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-strava-orange/10">
          <SportIcon className="h-8 w-8 text-strava-orange" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{goal.title}</h1>
            <GoalStatusBadge status={goal.status} />
          </div>

          {goal.description && <p className="text-muted-foreground">{goal.description}</p>}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">{t('actions.menu')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit} disabled={!canEdit}>
              <Edit className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive} disabled={archiving || !canArchive}>
              <Archive className="mr-2 h-4 w-4" />
              {t('actions.archive')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GoalDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        goalTitle={goal.title}
        onConfirm={handleDelete}
      />
    </>
  );
}
