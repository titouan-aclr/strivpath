export const SYNC_POLL_INTERVAL = 2000;
export const SYNC_TIMEOUT_MS = 60000;
export const REDIRECT_DELAY_MS = 1000;
export const CONFIRMATION_AUTO_REDIRECT_MS = 3000;
export const MAX_SPORTS_SELECTION = 3;
export const MIN_SPORTS_SELECTION = 1;

export const ONBOARDING_TOAST_IDS = {
  SAVE_ERROR: 'onboarding-save-error',
  SYNC_ERROR: 'onboarding-sync-error',
  NETWORK_ERROR: 'onboarding-network-error',
  RATE_LIMIT: 'onboarding-rate-limit',
} as const;

export type OnboardingToastId = (typeof ONBOARDING_TOAST_IDS)[keyof typeof ONBOARDING_TOAST_IDS];

export const ONBOARDING_TOAST_CONFIG = {
  SAVE_ERROR: {
    id: ONBOARDING_TOAST_IDS.SAVE_ERROR,
    duration: 5000,
    dismissible: true,
  },
  SYNC_ERROR: {
    id: ONBOARDING_TOAST_IDS.SYNC_ERROR,
    duration: 8000,
    dismissible: true,
  },
  NETWORK_ERROR: {
    id: ONBOARDING_TOAST_IDS.NETWORK_ERROR,
    duration: 5000,
    dismissible: true,
  },
  RATE_LIMIT: {
    id: ONBOARDING_TOAST_IDS.RATE_LIMIT,
    duration: Infinity,
    dismissible: true,
  },
} as const;
