'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@/lib/graphql';
import { SyncActivitiesDocument, SyncStatusDocument, type SyncHistory, SyncStatus } from '@/gql/graphql';
import { SYNC_POLL_INTERVAL, SYNC_TIMEOUT_MS, REDIRECT_DELAY_MS, ONBOARDING_TOAST_IDS } from './constants';

interface UseSyncProgressResult {
  syncStatus: SyncHistory | null;
  error: string | null;
  isInitializing: boolean;
  isRedirecting: boolean;
  handleRetry: () => void;
}

export function useSyncProgress(): UseSyncProgressResult {
  const router = useRouter();
  const t = useTranslations('onboarding.sync');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(currentStatus.errorMessage || t('errors.syncFailed'));
        return;
      }

      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setError(t('timeout'));
      }, SYNC_TIMEOUT_MS);
    } catch {
      setError(t('errors.syncFailed'));
      toast.error(t('errors.syncFailed'), {
        id: ONBOARDING_TOAST_IDS.SYNC_ERROR,
      });
    }
  }, [syncActivities, refetch, startPolling, stopPolling, router, t]);

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
      setError(syncStatus.errorMessage || t('errors.syncFailed'));
    }
  }, [syncStatus, stopPolling, router, t]);

  const handleRetry = useCallback(() => {
    setError(null);
    try {
      void syncActivities();
      startPolling();

      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setError(t('timeout'));
      }, SYNC_TIMEOUT_MS);
    } catch {
      setError(t('errors.syncFailed'));
      toast.error(t('errors.syncFailed'), {
        id: ONBOARDING_TOAST_IDS.SYNC_ERROR,
      });
    }
  }, [syncActivities, startPolling, stopPolling, t]);

  return {
    syncStatus,
    error,
    isInitializing,
    isRedirecting,
    handleRetry,
  };
}
