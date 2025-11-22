'use client';

import { useTranslations } from 'next-intl';
import { Footprints, Bike, Waves, Loader2, type LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SportCard } from './sport-card';
import { useSportSelection } from '@/lib/onboarding/use-sport-selection';
import { SportType } from '@/gql/graphql';
import { MAX_SPORTS_SELECTION } from '@/lib/onboarding/constants';

const SPORTS_CONFIG: Array<{
  sport: SportType;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}> = [
  {
    sport: SportType.Run,
    icon: Footprints,
    titleKey: 'onboarding.sports.run.title',
    descKey: 'onboarding.sports.run.description',
  },
  {
    sport: SportType.Ride,
    icon: Bike,
    titleKey: 'onboarding.sports.ride.title',
    descKey: 'onboarding.sports.ride.description',
  },
  {
    sport: SportType.Swim,
    icon: Waves,
    titleKey: 'onboarding.sports.swim.title',
    descKey: 'onboarding.sports.swim.description',
  },
];

export function SportSelectionForm() {
  const t = useTranslations();
  const { selectedSports, toggleSport, handleSubmit, isSubmitting, canSubmit } = useSportSelection();

  const maxReached = selectedSports.length >= MAX_SPORTS_SELECTION;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('onboarding.sports.title')}</CardTitle>
        <CardDescription>{t('onboarding.sports.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SPORTS_CONFIG.map(({ sport, icon, titleKey, descKey }) => (
            <SportCard
              key={sport}
              sport={sport}
              title={t(titleKey)}
              description={t(descKey)}
              icon={icon}
              selected={selectedSports.includes(sport)}
              disabled={isSubmitting}
              maxReached={maxReached && !selectedSports.includes(sport)}
              onToggle={() => toggleSport(sport)}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!canSubmit}
            size="lg"
            className="w-full md:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('onboarding.sports.saving')}
              </>
            ) : (
              t('onboarding.sports.continue')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
