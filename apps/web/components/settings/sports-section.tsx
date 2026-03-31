'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Dumbbell, Footprints, Bike, Waves, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPreferences } from '@/lib/settings/use-user-preferences';
import { SportRemovalDialog } from './sport-removal-dialog';
import { AddSportDialog } from './add-sport-dialog';
import { SportType } from '@/gql/graphql';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';

const SPORT_CONFIG: Record<SportType, { icon: LucideIcon; labelKey: string }> = {
  [SportType.Run]: { icon: Footprints, labelKey: 'run' },
  [SportType.Ride]: { icon: Bike, labelKey: 'ride' },
  [SportType.Swim]: { icon: Waves, labelKey: 'swim' },
};

export function SportsSection() {
  const t = useTranslations('settings.sports');
  const tOnboarding = useTranslations('onboarding.sports');
  const { preferences, loading, refetch } = useUserPreferences();

  const [sportToRemove, setSportToRemove] = useState<SportType | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const selectedSports = preferences?.selectedSports ?? [];

  const handleRemoveSport = useCallback(
    (sport: SportType) => {
      if (selectedSports.length <= 1) {
        toast.error(t('lastSport'));
        return;
      }
      setSportToRemove(sport);
    },
    [selectedSports.length, t],
  );

  const getSportLabel = (sport: SportType): string => {
    const config = SPORT_CONFIG[sport];
    return config ? tOnboarding(`${config.labelKey}.title`) : sport;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {selectedSports.map(sport => {
              const config = SPORT_CONFIG[sport];
              if (!config) return null;

              const Icon = config.icon;
              const canRemove = selectedSports.length > 1;

              return (
                <Badge key={sport} variant="secondary" className="gap-1.5 py-1.5 pl-2 pr-1 text-sm">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {tOnboarding(`${config.labelKey}.title`)}
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-5 w-5 rounded-full hover:bg-destructive/20"
                      onClick={() => handleRemoveSport(sport)}
                      aria-label={`Remove ${tOnboarding(`${config.labelKey}.title`)}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  )}
                </Badge>
              );
            })}

            {selectedSports.length < Object.keys(SPORT_CONFIG).length && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('add')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <SportRemovalDialog
        open={sportToRemove !== null}
        onOpenChange={open => !open && setSportToRemove(null)}
        sport={sportToRemove}
        sportLabel={sportToRemove ? getSportLabel(sportToRemove) : ''}
        onSuccess={() => void refetch()}
      />

      <AddSportDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        selectedSports={selectedSports}
        onSuccess={() => void refetch()}
      />
    </>
  );
}
