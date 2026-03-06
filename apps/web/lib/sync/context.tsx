'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useApolloClient } from '@apollo/client/react';
import { useQuery, useMutation } from '@/lib/graphql';
import { SyncActivitiesDocument, LatestSyncHistoryDocument, SyncStatus, type SyncHistory } from '@/gql/graphql';
import { useAuth } from '@/lib/auth/context';
import { useGoalSyncNotifications } from '@/lib/goals/use-goal-sync-notifications';
import { classifyOnboardingError, logOnboardingError, type OnboardingError } from '@/lib/onboarding/error-handling';
import { SYNC_POLL_INTERVAL, SYNC_TIMEOUT_MS, ONBOARDING_TOAST_CONFIG } from '@/lib/onboarding/constants';
import { SYNC_STALENESS_THRESHOLD_MS } from './constants';
import type { SyncContextValue, SyncTriggerSource } from './types';

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

interface SyncContextProviderProps {
  children: React.ReactNode;
}

export function SyncContextProvider({ children }: SyncContextProviderProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const { notifyGoalUpdates } = useGoalSyncNotifications();
  const client = useApolloClient();

  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<OnboardingError | null>(null);
  const [triggerSource, setTriggerSource] = useState<SyncTriggerSource | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCompletedSyncIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const hasCheckedStaleness = useRef(false);

  const [syncActivitiesMutation] = useMutation(SyncActivitiesDocument);
  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery(LatestSyncHistoryDocument, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  const syncHistory = useMemo(() => {
    return (data?.latestSyncHistory as SyncHistory | null) ?? null;
  }, [data?.latestSyncHistory]);

  const isSyncing = syncHistory?.status === SyncStatus.InProgress || syncHistory?.status === SyncStatus.Pending;

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(() => {
      void refetch();
    }, SYNC_POLL_INTERVAL);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      const timeoutError = new Error(t('onboarding.sync.timeout'));
      const onboardingError = classifyOnboardingError(timeoutError, t);
      logOnboardingError({
        location: 'sync-context/polling/timeout',
        errorType: onboardingError.type,
        errorCode: onboardingError.code,
        supportId: onboardingError.supportId,
        userId: user?.id,
        rawError: timeoutError,
      });
      setError(onboardingError);
      toast.error(t('settings.sync.syncError'));
    }, SYNC_TIMEOUT_MS);
  }, [refetch, stopPolling, t, user?.id]);

  useEffect(() => {
    if (!syncHistory) return;

    const isTerminalStatus = syncHistory.status === SyncStatus.Completed || syncHistory.status === SyncStatus.Failed;

    if (!initializedRef.current && isTerminalStatus) {
      lastCompletedSyncIdRef.current = syncHistory.id;
      initializedRef.current = true;
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
    }

    if (isTerminalStatus && isPolling) {
      const syncId = syncHistory.id;
      const isNewCompletion = syncId !== lastCompletedSyncIdRef.current;

      if (!isNewCompletion) {
        return;
      }

      stopPolling();
      lastCompletedSyncIdRef.current = syncId;

      if (syncHistory.status === SyncStatus.Completed) {
        if (syncHistory.goalsUpdatedCount || syncHistory.goalsCompletedCount) {
          notifyGoalUpdates({
            goalsUpdatedCount: syncHistory.goalsUpdatedCount ?? undefined,
            goalsCompletedCount: syncHistory.goalsCompletedCount ?? undefined,
            completedGoalIds: syncHistory.completedGoalIds ?? undefined,
          });
        }

        toast.success(t('settings.sync.syncSuccess'));
        void client.refetchQueries({ include: ['DashboardData', 'Goals', 'ActiveGoals'] });
      }

      if (syncHistory.status === SyncStatus.Failed) {
        const failedError = new Error(syncHistory.errorMessage || t('onboarding.errors.syncFailed'));
        const onboardingError = classifyOnboardingError(failedError, t);
        logOnboardingError({
          location: 'sync-context/syncStatusEffect/failed',
          errorType: onboardingError.type,
          errorCode: onboardingError.code,
          supportId: onboardingError.supportId,
          userId: user?.id,
          syncHistoryId: Number(syncId),
          rawError: failedError,
        });
        setError(onboardingError);
        if (onboardingError.type === 'rate_limit') {
          const isDaily = onboardingError.retriable === false;
          toast.error(
            isDaily ? t('settings.sync.rateLimitDailyError') : t('settings.sync.rateLimitError'),
            ONBOARDING_TOAST_CONFIG.RATE_LIMIT,
          );
        } else {
          toast.error(t('settings.sync.syncError'));
        }
      }

      setTriggerSource(null);
    }

    if (syncHistory.status === SyncStatus.InProgress && !isPolling && !error) {
      startPolling();
    }
  }, [syncHistory, isPolling, stopPolling, startPolling, notifyGoalUpdates, t, user?.id, error, client]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const triggerSync = useCallback(
    (source: SyncTriggerSource = 'manual'): boolean => {
      if (isSyncing || isPolling) {
        return false;
      }

      setError(null);
      setTriggerSource(source);

      void syncActivitiesMutation();
      startPolling();

      return true;
    },
    [isSyncing, isPolling, syncActivitiesMutation, startPolling],
  );

  const retry = useCallback(() => {
    setError(null);
    triggerSync(triggerSource ?? 'manual');
  }, [triggerSync, triggerSource]);

  const refreshStatus = useCallback(async () => {
    try {
      await refetch();
    } catch (err) {
      const onboardingError = classifyOnboardingError(err, t);
      logOnboardingError({
        location: 'sync-context/refreshStatus',
        errorType: onboardingError.type,
        errorCode: onboardingError.code,
        supportId: onboardingError.supportId,
        userId: user?.id,
        rawError: err,
      });
      setError(onboardingError);
    }
  }, [refetch, t, user?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!syncHistory || hasCheckedStaleness.current) return;

    if (syncHistory.status !== SyncStatus.Completed) {
      hasCheckedStaleness.current = true;
      return;
    }

    if (isSyncing || isPolling) {
      hasCheckedStaleness.current = true;
      return;
    }

    hasCheckedStaleness.current = true;

    const completedAt = syncHistory.completedAt ? new Date(String(syncHistory.completedAt)) : null;
    const staleThreshold = new Date(Date.now() - SYNC_STALENESS_THRESHOLD_MS);

    if (!completedAt || completedAt < staleThreshold) {
      triggerSync('auto');
    }
  }, [syncHistory, isSyncing, isPolling, triggerSync]);

  const value: SyncContextValue = {
    syncHistory,
    isPolling,
    isSyncing,
    isLoading,
    error,
    triggerSource,
    triggerSync,
    retry,
    refreshStatus,
    clearError,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within SyncContextProvider');
  }
  return context;
}
