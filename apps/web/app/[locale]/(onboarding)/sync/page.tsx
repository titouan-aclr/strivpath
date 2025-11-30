'use client';

import { SyncProgress } from '@/components/onboarding/sync-progress';
import { useSyncProgress } from '@/lib/onboarding/use-sync-progress';

export default function SyncPage() {
  const { syncStatus, error, isInitializing, handleRetry } = useSyncProgress();

  return <SyncProgress syncStatus={syncStatus} error={error} isInitializing={isInitializing} onRetry={handleRetry} />;
}
