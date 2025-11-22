export const SYNC_POLL_INTERVAL = 2000;
export const SYNC_TIMEOUT_MS = 60000;
export const REDIRECT_DELAY_MS = 1000;
export const MAX_SPORTS_SELECTION = 3;
export const MIN_SPORTS_SELECTION = 1;

export const ONBOARDING_TOAST_IDS = {
  SAVE_ERROR: 'onboarding-save-error',
  SYNC_ERROR: 'onboarding-sync-error',
} as const;

export type OnboardingToastId = (typeof ONBOARDING_TOAST_IDS)[keyof typeof ONBOARDING_TOAST_IDS];
