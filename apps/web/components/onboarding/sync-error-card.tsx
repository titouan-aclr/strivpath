'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Wifi, Clock, HelpCircle, AlertTriangle, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { OnboardingError } from '@/lib/onboarding/error-handling';

interface SyncErrorCardProps {
  error: OnboardingError;
  onRetry?: () => void;
  onReconnect?: () => void;
}

const ERROR_ICONS: Record<OnboardingError['type'], LucideIcon> = {
  network: Wifi,
  token_expired: AlertTriangle,
  rate_limit: Clock,
  sync_failed: AlertCircle,
  unknown: HelpCircle,
};

export function SyncErrorCard({ error, onRetry, onReconnect }: SyncErrorCardProps) {
  const t = useTranslations('onboarding');
  const Icon = ERROR_ICONS[error.type];

  return (
    <Card className="w-full min-h-[480px] flex flex-col border-destructive">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Icon className="h-5 w-5 text-destructive" aria-hidden="true" />
          <CardTitle>{t('sync.title')}</CardTitle>
        </div>
        <CardDescription>{t('sync.description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <Icon className="h-12 w-12 text-destructive" aria-hidden="true" />

          <div className="w-full space-y-4">
            <div className="rounded-md bg-destructive/10 p-4">
              <p className="text-sm text-destructive text-center font-medium">{error.message}</p>
              {error.code && error.code !== 'UNKNOWN' && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t('errors.errorCode', { code: error.code })}
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {t('errors.supportId')}: <code className="font-mono">{error.supportId}</code>
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full">
            {error.type === 'token_expired' && onReconnect && (
              <Button onClick={onReconnect} size="lg" className="flex-1">
                {t('errors.reconnectButton')}
              </Button>
            )}

            {error.retriable && onRetry && (
              <Button onClick={onRetry} variant="outline" size="lg" className="flex-1">
                {t('sync.retry')}
              </Button>
            )}

            {error.type === 'unknown' && (
              <Button
                onClick={() => {
                  window.location.href = '/contact';
                }}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                {t('errors.contactSupport')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
