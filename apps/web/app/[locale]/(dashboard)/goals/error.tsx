'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function GoalsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('Goals page error:', error);
  }, [error]);

  return (
    <div className="container py-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('unexpected.title')}</AlertTitle>
        <AlertDescription className="mt-2">
          {t('unexpected.description')}
          {error.digest && <p className="mt-2 text-xs opacity-70">Error ID: {error.digest}</p>}
        </AlertDescription>
      </Alert>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => reset()}>{t('unexpected.retry')}</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/goals')}>
          {t('unexpected.goHome')}
        </Button>
      </div>
    </div>
  );
}
