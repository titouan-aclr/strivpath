'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@/lib/graphql';
import { SyncActivitiesDocument, SyncStatusDocument, type SyncHistory, SyncStatus } from '@/gql/graphql';
import { SYNC_POLL_INTERVAL, SYNC_TIMEOUT_MS, REDIRECT_DELAY_MS, ONBOARDING_TOAST_CONFIG } from './constants';
import { classifyOnboardingError, logOnboardingError, type OnboardingError } from './error-handling';
import { useAuth } from '@/lib/auth/context';

interface UseSyncProgressResult {
  syncStatus: SyncHistory | null;
  error: OnboardingError | null;
  isInitializing: boolean;
  isRedirecting: boolean;
  handleRetry: () => void;
}

export function useSyncProgress(): UseSyncProgressResult {
  const router = useRouter();
  const t = useTranslations('onboarding.sync');
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<OnboardingError | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  const [syncActivities] = useMutation(SyncActivitiesDocument);
  const { data, refetch } = useQuery(SyncStatusDocument, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const syncStatus = data?.syncStatus ?? null;
  const isInitializing = !syncStatus && !error && !isRedirecting;

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => {
      void refetch();
    }, SYNC_POLL_INTERVAL);
  }, [refetch, stopPolling]);

  const initSync = useCallback(async () => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    try {
      const { data: statusData } = await refetch();
      const currentStatus = statusData?.syncStatus;

      if (!currentStatus) {
        void syncActivities();
        startPolling();
      } else if (currentStatus.status === SyncStatus.Completed) {
        setIsRedirecting(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, REDIRECT_DELAY_MS);
        return;
      } else if (currentStatus.status === SyncStatus.InProgress) {
        startPolling();
      } else if (currentStatus.status === SyncStatus.Failed) {
        const failedError = new Error(currentStatus.errorMessage || t('errors.syncFailed'));
        const onboardingError = classifyOnboardingError(failedError, t);
        logOnboardingError({
          location: 'use-sync-progress/initSync/existingFailedSync',
          errorType: onboardingError.type,
          errorCode: onboardingError.code,
          supportId: onboardingError.supportId,
          userId: user?.id,
          rawError: failedError,
        });
        setError(onboardingError);
        return;
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopPolling();
        const timeoutError = new Error(t('timeout'));
        const onboardingError = classifyOnboardingError(timeoutError, t);
        logOnboardingError({
          location: 'use-sync-progress/initSync/timeout',
          errorType: onboardingError.type,
          errorCode: onboardingError.code,
          supportId: onboardingError.supportId,
          userId: user?.id,
          rawError: timeoutError,
        });
        setError(onboardingError);
      }, SYNC_TIMEOUT_MS);
    } catch (err) {
      const onboardingError = classifyOnboardingError(err, t);
      logOnboardingError({
        location: 'use-sync-progress/initSync',
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
          duration: config.duration,
          dismissible: config.dismissible,
        });
      }
    }
  }, [syncActivities, refetch, startPolling, stopPolling, router, t, user]);

  useEffect(() => {
    void initSync();

    return () => {
      stopPolling();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [initSync, stopPolling]);

  useEffect(() => {
    if (!syncStatus) return;

    if (syncStatus.status === SyncStatus.Completed) {
      stopPolling();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setIsRedirecting(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, REDIRECT_DELAY_MS);
    }

    if (syncStatus.status === SyncStatus.Failed) {
      stopPolling();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const failedError = new Error(syncStatus.errorMessage || t('errors.syncFailed'));
      const onboardingError = classifyOnboardingError(failedError, t);
      logOnboardingError({
        location: 'use-sync-progress/syncStatusEffect/failed',
        errorType: onboardingError.type,
        errorCode: onboardingError.code,
        supportId: onboardingError.supportId,
        userId: user?.id,
        rawError: failedError,
      });
      setError(onboardingError);
    }
  }, [syncStatus, stopPolling, t, user?.id]);

  const handleRetry = useCallback(() => {
    setError(null);
    try {
      void syncActivities();
      startPolling();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopPolling();
        const timeoutError = new Error(t('timeout'));
        const onboardingError = classifyOnboardingError(timeoutError, t);
        logOnboardingError({
          location: 'use-sync-progress/handleRetry/timeout',
          errorType: onboardingError.type,
          errorCode: onboardingError.code,
          supportId: onboardingError.supportId,
          userId: user?.id,
          rawError: timeoutError,
        });
        setError(onboardingError);
      }, SYNC_TIMEOUT_MS);
    } catch (err) {
      const onboardingError = classifyOnboardingError(err, t);
      logOnboardingError({
        location: 'use-sync-progress/handleRetry',
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
          duration: config.duration,
          dismissible: config.dismissible,
        });
      }
    }
  }, [syncActivities, startPolling, stopPolling, t, user]);

  return {
    syncStatus,
    error,
    isInitializing,
    isRedirecting,
    handleRetry,
  };
}
