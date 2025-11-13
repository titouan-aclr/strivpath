export const AUTH_TOAST_IDS = {
  NETWORK_ERROR: 'auth-network-error',
  AUTH_ERROR: 'auth-error',
  REFRESH_FAILED: 'auth-refresh-failed',
} as const;

export type AuthToastId = (typeof AUTH_TOAST_IDS)[keyof typeof AUTH_TOAST_IDS];

export const AUTH_TOAST_CONFIG = {
  NETWORK_ERROR: {
    id: AUTH_TOAST_IDS.NETWORK_ERROR,
    duration: 5000,
    dismissible: true,
  },
  AUTH_ERROR: {
    id: AUTH_TOAST_IDS.AUTH_ERROR,
    duration: Infinity,
    dismissible: true,
  },
  REFRESH_FAILED: {
    id: AUTH_TOAST_IDS.REFRESH_FAILED,
    duration: 8000,
    dismissible: true,
  },
} as const;
