'use client';

import { useCallback, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useMutation, SportType } from '@/lib/graphql';
import {
  RemoveSportFromPreferencesDocument,
  DeleteUserDataDocument,
  DeleteAccountDocument,
  AddSportToPreferencesDocument,
  CompleteOnboardingDocument,
  UserPreferencesInfoFragmentDoc,
  type AddSportToPreferencesMutation,
  type CompleteOnboardingMutation,
  type RemoveSportFromPreferencesMutation,
  type DeleteUserDataMutation,
  type DeleteAccountMutation,
  type UserPreferencesInfoFragment,
} from '@/gql/graphql';
import { getFragmentData } from '@/gql/fragment-masking';

interface UseAddSportResult {
  addSport: (sport: SportType) => Promise<UserPreferencesInfoFragment | null>;
  loading: boolean;
  error: Error | undefined;
}

export function useAddSport(): UseAddSportResult {
  const t = useTranslations('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [addSportMutation] = useMutation<AddSportToPreferencesMutation>(AddSportToPreferencesDocument, {
    refetchQueries: ['UserPreferences'],
    awaitRefetchQueries: true,
  });

  const addSport = useCallback(
    async (sport: SportType) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await addSportMutation({
          variables: { sport },
        });

        if (!result.data?.addSportToPreferences) {
          throw new Error('Failed to add sport');
        }

        const preferences = getFragmentData(UserPreferencesInfoFragmentDoc, result.data.addSportToPreferences);

        toast.success(t('sports.addSuccess'));
        return preferences;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error(t('sports.addError'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addSportMutation, t],
  );

  return {
    addSport,
    loading: isLoading,
    error,
  };
}

interface UseRemoveSportResult {
  removeSport: (sport: SportType, deleteData: boolean) => Promise<boolean>;
  loading: boolean;
  error: Error | undefined;
}

export function useRemoveSport(): UseRemoveSportResult {
  const t = useTranslations('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [removeSportMutation] = useMutation<RemoveSportFromPreferencesMutation>(RemoveSportFromPreferencesDocument, {
    refetchQueries: ['UserPreferences', 'Goals', 'ActiveGoals', 'Activities'],
    awaitRefetchQueries: true,
  });

  const removeSport = useCallback(
    async (sport: SportType, deleteData: boolean) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await removeSportMutation({
          variables: { sport, deleteData },
        });

        if (result.data?.removeSportFromPreferences !== true) {
          throw new Error('Failed to remove sport');
        }

        toast.success(t('sports.removeSuccess'));
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        toast.error(t('sports.removeError'));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [removeSportMutation, t],
  );

  return {
    removeSport,
    loading: isLoading,
    error,
  };
}

interface UseCompleteOnboardingResult {
  completeOnboarding: () => Promise<UserPreferencesInfoFragment | null>;
  loading: boolean;
  error: Error | undefined;
}

export function useCompleteOnboarding(): UseCompleteOnboardingResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [completeOnboardingMutation] = useMutation<CompleteOnboardingMutation>(CompleteOnboardingDocument, {
    refetchQueries: ['UserPreferences'],
    awaitRefetchQueries: true,
  });

  const completeOnboarding = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await completeOnboardingMutation();

      if (!result.data?.completeOnboarding) {
        throw new Error('Failed to complete onboarding');
      }

      const preferences = getFragmentData(UserPreferencesInfoFragmentDoc, result.data.completeOnboarding);

      return preferences;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [completeOnboardingMutation]);

  return {
    completeOnboarding,
    loading: isLoading,
    error,
  };
}

interface UseDeleteUserDataResult {
  deleteUserData: () => Promise<boolean>;
  loading: boolean;
  error: Error | undefined;
}

export function useDeleteUserData(): UseDeleteUserDataResult {
  const t = useTranslations('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [deleteUserDataMutation] = useMutation<DeleteUserDataMutation>(DeleteUserDataDocument, {
    refetchQueries: ['UserPreferences', 'Goals', 'ActiveGoals', 'Activities', 'LatestSyncHistory'],
    awaitRefetchQueries: true,
  });

  const deleteUserData = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await deleteUserDataMutation();

      if (result.data?.deleteUserData !== true) {
        throw new Error('Failed to delete user data');
      }

      toast.success(t('dangerZone.deleteData.success'));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      toast.error(t('dangerZone.deleteData.error'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deleteUserDataMutation, t]);

  return {
    deleteUserData,
    loading: isLoading,
    error,
  };
}

interface UseDeleteAccountResult {
  deleteAccount: () => Promise<boolean>;
  loading: boolean;
  error: Error | undefined;
}

export function useDeleteAccount(): UseDeleteAccountResult {
  const router = useRouter();
  const t = useTranslations('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [deleteAccountMutation] = useMutation<DeleteAccountMutation>(DeleteAccountDocument);

  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await deleteAccountMutation();

      if (result.data?.deleteAccount !== true) {
        throw new Error('Failed to delete account');
      }

      toast.success(t('dangerZone.deleteAccount.success'));
      router.push('/login');
      router.refresh();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      toast.error(t('dangerZone.deleteAccount.error'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deleteAccountMutation, router, t]);

  return {
    deleteAccount,
    loading: isLoading,
    error,
  };
}
