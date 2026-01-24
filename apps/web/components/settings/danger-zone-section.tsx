'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteDataDialog } from './delete-data-dialog';
import { DeleteAccountDialog } from './delete-account-dialog';

export function DangerZoneSection() {
  const t = useTranslations('settings.dangerZone');
  const [showDeleteDataDialog, setShowDeleteDataDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('warning')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">{t('deleteData.title')}</h4>
              <p className="text-sm text-muted-foreground">{t('deleteData.description')}</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDataDialog(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('deleteData.button')}
            </Button>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">{t('deleteAccount.title')}</h4>
              <p className="text-sm text-muted-foreground">{t('deleteAccount.description')}</p>
            </div>
            <Button variant="destructive" className="gap-2" onClick={() => setShowDeleteAccountDialog(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('deleteAccount.button')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteDataDialog open={showDeleteDataDialog} onOpenChange={setShowDeleteDataDialog} />

      <DeleteAccountDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog} />
    </>
  );
}
