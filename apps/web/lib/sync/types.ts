import type { SyncHistory } from '@/gql/graphql';
import type { OnboardingError } from '@/lib/onboarding/error-handling';

export type SyncTriggerSource = 'manual' | 'add_sport' | 'auto';

export interface SyncState {
  syncHistory: SyncHistory | null;
  isPolling: boolean;
  isSyncing: boolean;
  isLoading: boolean;
  error: OnboardingError | null;
  triggerSource: SyncTriggerSource | null;
}

export interface SyncActions {
  triggerSync: (source?: SyncTriggerSource) => boolean;
  retry: () => void;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

export interface SyncContextValue extends SyncState, SyncActions {}
