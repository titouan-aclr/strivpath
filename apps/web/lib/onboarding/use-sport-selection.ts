'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useMutation } from '@/lib/graphql';
import { UpdateUserPreferencesDocument, type UpdateUserPreferencesMutation, SportType } from '@/gql/graphql';
import { MIN_SPORTS_SELECTION, MAX_SPORTS_SELECTION, ONBOARDING_TOAST_IDS } from './constants';

interface UseSportSelectionResult {
  selectedSports: SportType[];
  toggleSport: (sport: SportType) => void;
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export function useSportSelection(): UseSportSelectionResult {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const [selectedSports, setSelectedSports] = useState<SportType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatePreferences] = useMutation<UpdateUserPreferencesMutation>(UpdateUserPreferencesDocument);

  const toggleSport = useCallback((sport: SportType) => {
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : prev.length < MAX_SPORTS_SELECTION
          ? [...prev, sport]
          : prev,
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (selectedSports.length < MIN_SPORTS_SELECTION) {
      toast.error(t('sports.validation.minOne'), {
        id: ONBOARDING_TOAST_IDS.SAVE_ERROR,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePreferences({
        variables: { input: { selectedSports } },
      });
      router.push('/sync');
    } catch {
      toast.error(t('errors.saveFailed'), {
        id: ONBOARDING_TOAST_IDS.SAVE_ERROR,
        description: t('errors.pleaseTryAgain'),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSports, isSubmitting, updatePreferences, router, t]);

  const canSubmit = selectedSports.length >= MIN_SPORTS_SELECTION && !isSubmitting;

  return {
    selectedSports,
    toggleSport,
    handleSubmit,
    isSubmitting,
    canSubmit,
  };
}
