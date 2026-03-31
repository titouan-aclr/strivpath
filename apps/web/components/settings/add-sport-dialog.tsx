'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Footprints, Bike, Waves, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAddSport } from '@/lib/settings/use-settings-mutations';
import { useSync } from '@/lib/sync/context';
import { SportType } from '@/gql/graphql';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface AddSportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSports: SportType[];
  onSuccess?: () => void;
}

const ALL_SPORTS: { type: SportType; icon: LucideIcon; labelKey: string }[] = [
  { type: SportType.Run, icon: Footprints, labelKey: 'run' },
  { type: SportType.Ride, icon: Bike, labelKey: 'ride' },
  { type: SportType.Swim, icon: Waves, labelKey: 'swim' },
];

export function AddSportDialog({ open, onOpenChange, selectedSports, onSuccess }: AddSportDialogProps) {
  const t = useTranslations('settings.sports');
  const tOnboarding = useTranslations('onboarding.sports');
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const { addSport, loading } = useAddSport();
  const { triggerSync } = useSync();

  const availableSports = ALL_SPORTS.filter(sport => !selectedSports.includes(sport.type));

  const handleConfirm = async () => {
    if (!selectedSport) return;

    const result = await addSport(selectedSport);
    if (result) {
      triggerSync('add_sport');
      onOpenChange(false);
      setSelectedSport(null);
      onSuccess?.();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setSelectedSport(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Plus className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <DialogTitle>{t('addDialog.title')}</DialogTitle>
          </div>
          <DialogDescription>{t('addDialog.description')}</DialogDescription>
        </DialogHeader>

        {availableSports.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">{t('addDialog.noSportsAvailable')}</p>
        ) : (
          <div className="grid gap-3">
            {availableSports.map(sport => {
              const Icon = sport.icon;
              const isSelected = selectedSport === sport.type;

              return (
                <Card
                  key={sport.type}
                  role="button"
                  aria-pressed={isSelected}
                  tabIndex={0}
                  onClick={() => setSelectedSport(sport.type)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSport(sport.type);
                    }
                  }}
                  className={cn(
                    'cursor-pointer transition-all',
                    isSelected && 'selected-ring',
                    !isSelected && 'hover:border-muted-foreground/50',
                  )}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={cn(
                        'rounded-full p-3 transition-colors',
                        isSelected ? 'bg-primary text-white' : 'bg-muted',
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{tOnboarding(`${sport.labelKey}.title`)}</p>
                      <p className="text-sm text-muted-foreground">{tOnboarding(`${sport.labelKey}.description`)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            {t('addDialog.cancel')}
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={loading || !selectedSport || availableSports.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('addDialog.confirm')}
              </>
            ) : (
              t('addDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
