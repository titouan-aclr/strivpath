'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSportDataCount } from '@/lib/settings/use-sport-data-count';
import { useRemoveSport } from '@/lib/settings/use-settings-mutations';
import { SportType } from '@/gql/graphql';

interface SportRemovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sport: SportType | null;
  sportLabel: string;
  onSuccess?: () => void;
}

export function SportRemovalDialog({ open, onOpenChange, sport, sportLabel, onSuccess }: SportRemovalDialogProps) {
  const t = useTranslations('settings.sports.removalDialog');
  const [deleteData, setDeleteData] = useState(false);
  const { data: sportDataCount, loading: loadingCount } = useSportDataCount(open ? sport : null);
  const { removeSport, loading: removing } = useRemoveSport();

  const handleConfirm = async () => {
    if (!sport) return;

    const success = await removeSport(sport, deleteData);
    if (success) {
      onOpenChange(false);
      setDeleteData(false);
      onSuccess?.();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!removing) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setDeleteData(false);
      }
    }
  };

  const hasData = sportDataCount && (sportDataCount.activitiesCount > 0 || sportDataCount.goalsCount > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <DialogTitle>{t('title', { sport: sportLabel })}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {loadingCount ? (
              <span className="inline-block h-4 w-3/4 animate-pulse rounded-md bg-primary/10" />
            ) : hasData ? (
              t('description', {
                activitiesCount: sportDataCount?.activitiesCount ?? 0,
                goalsCount: sportDataCount?.goalsCount ?? 0,
              })
            ) : (
              t('noData')
            )}
          </DialogDescription>
        </DialogHeader>

        {hasData && (
          <RadioGroup
            value={deleteData ? 'delete' : 'keep'}
            onValueChange={value => setDeleteData(value === 'delete')}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <RadioGroupItem value="keep" id="keep-data" className="mt-0.5" />
              <Label htmlFor="keep-data" className="cursor-pointer space-y-1">
                <span className="font-medium">{t('keepData')}</span>
                <p className="text-sm text-muted-foreground">{t('keepDataDescription')}</p>
              </Label>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border border-destructive/50 p-4 transition-colors hover:bg-destructive/5">
              <RadioGroupItem value="delete" id="delete-data" className="mt-0.5" />
              <Label htmlFor="delete-data" className="cursor-pointer space-y-1">
                <span className="font-medium text-destructive">{t('deleteData')}</span>
                <p className="text-sm text-muted-foreground">{t('deleteDataDescription')}</p>
              </Label>
            </div>
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={removing}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()} disabled={removing || loadingCount}>
            {removing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('confirm')}
              </>
            ) : (
              t('confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
