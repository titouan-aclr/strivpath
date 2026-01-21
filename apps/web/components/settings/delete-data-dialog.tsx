'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteUserData } from '@/lib/settings/use-settings-mutations';

interface DeleteDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteDataDialog({ open, onOpenChange, onSuccess }: DeleteDataDialogProps) {
  const t = useTranslations('settings.dangerZone.deleteData.dialog');
  const { deleteUserData, loading } = useDeleteUserData();

  const handleConfirm = async () => {
    const success = await deleteUserData();
    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2 pt-2">
            <span>{t('description')}</span>
            <span className="block font-medium text-destructive">{t('warning')}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleConfirm()}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('confirm')}
              </>
            ) : (
              t('confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
