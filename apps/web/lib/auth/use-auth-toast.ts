'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuth } from './context';
import { isNetworkError, isUnauthenticatedError } from './token-refresh-shared';
import { AUTH_TOAST_CONFIG } from './constants';

export function useAuthToast() {
  const t = useTranslations('auth.errors');
  const { error } = useAuth();
  const prevErrorRef = useRef<Error | null>(null);

  useEffect(() => {
    if (!error) {
      prevErrorRef.current = null;
      return;
    }

    if (error === prevErrorRef.current) {
      return;
    }

    prevErrorRef.current = error;

    if (isNetworkError(error)) {
      const config = AUTH_TOAST_CONFIG.NETWORK_ERROR;
      toast.error(t('networkError'), {
        id: config.id,
        description: t('retrying'),
        duration: config.duration,
        dismissible: config.dismissible,
      });
    } else if (isUnauthenticatedError(error)) {
      const config = AUTH_TOAST_CONFIG.AUTH_ERROR;
      toast.error(t('authFailed'), {
        id: config.id,
        description: t('pleaseLogin'),
        duration: config.duration,
        dismissible: config.dismissible,
      });
    } else {
      const config = AUTH_TOAST_CONFIG.REFRESH_FAILED;
      toast.error(t('unexpectedError'), {
        id: config.id,
        description: error.message,
        duration: config.duration,
        dismissible: config.dismissible,
      });
    }
  }, [error, t]);
}
