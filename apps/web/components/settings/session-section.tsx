'use client';

import { useTranslations } from 'next-intl';
import { LogOut, Loader2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/lib/auth/use-logout';

export function SessionSection() {
  const t = useTranslations('settings.session');
  const { logout, isLoading } = useLogout();

  const handleLogout = () => {
    void logout();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="gap-2" onClick={handleLogout} disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('loggingOut')}
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {t('logout')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
