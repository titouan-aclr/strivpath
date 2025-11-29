'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useMutation } from '@/lib/graphql';
import { UpdateUserPreferencesDocument, type UpdateUserPreferencesMutation, SportType } from '@/gql/graphql';
import { MIN_SPORTS_SELECTION, MAX_SPORTS_SELECTION, ONBOARDING_TOAST_CONFIG } from './constants';
import { classifyOnboardingError, logOnboardingError, type OnboardingError } from './error-handling';
import { useAuth } from '@/lib/auth/context';

interface UseSportSelectionResult {
  selectedSports: SportType[];
  toggleSport: (sport: SportType) => void;
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
  error: OnboardingError | null;
}

export function useSportSelection(): UseSportSelectionResult {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const { user } = useAuth();
  const [selectedSports, setSelectedSports] = useState<SportType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<OnboardingError | null>(null);
  const [updatePreferences] = useMutation<UpdateUserPreferencesMutation>(UpdateUserPreferencesDocument);

  const toggleSport = useCallback(
    (sport: SportType) => {
      setSelectedSports(prev => {
        if (prev.includes(sport)) {
          return prev.filter(s => s !== sport);
        }

        if (prev.length >= MAX_SPORTS_SELECTION) {
          toast.info(t('sports.validation.maxThree'), {
            id: 'max-sports-reached',
            duration: 3000,
          });
          return prev;
        }

        return [...prev, sport];
      });
    },
    [t],
  );

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (selectedSports.length < MIN_SPORTS_SELECTION) {
      toast.error(t('sports.validation.minOne'), {
        id: ONBOARDING_TOAST_CONFIG.SAVE_ERROR.id,
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updatePreferences({
        variables: { input: { selectedSports } },
      });
      router.push('/sync');
    } catch (err) {
      const onboardingError = classifyOnboardingError(err, t);

      logOnboardingError({
        location: 'use-sport-selection/handleSubmit',
        errorType: onboardingError.type,
        errorCode: onboardingError.code,
        supportId: onboardingError.supportId,
        userId: user?.id,
        rawError: err,
      });

      setError(onboardingError);

      if (onboardingError.type === 'network') {
        const config = ONBOARDING_TOAST_CONFIG.NETWORK_ERROR;
        toast.error(onboardingError.message, {
          id: config.id,
          description: t('errors.networkDescription'),
          duration: config.duration,
          dismissible: config.dismissible,
        });
      } else {
        const config = ONBOARDING_TOAST_CONFIG.SAVE_ERROR;
        toast.error(onboardingError.message, {
          id: config.id,
          description: t('errors.pleaseTryAgain'),
          duration: config.duration,
          dismissible: config.dismissible,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSports, isSubmitting, updatePreferences, router, t, user]);

  const canSubmit = selectedSports.length >= MIN_SPORTS_SELECTION && !isSubmitting;

  return {
    selectedSports,
    toggleSport,
    handleSubmit,
    isSubmitting,
    canSubmit,
    error,
  };
}
