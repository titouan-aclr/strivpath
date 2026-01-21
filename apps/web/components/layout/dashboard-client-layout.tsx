'use client';

import { useTranslations } from 'next-intl';
import { AuthContextProvider } from '@/lib/auth/context';
import { SyncContextProvider } from '@/lib/sync/context';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AuthLoadingFallback } from '@/components/auth/auth-loading-fallback';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import type { User } from '@/lib/graphql';

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  initialUser: User | null;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth.error');

  const translations = {
    title: t('title'),
    description: t('description'),
    tryAgain: t('tryAgain'),
  };

  return (
    <AuthErrorBoundary translations={translations}>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthErrorBoundary>
  );
}

export function DashboardClientLayout({ children, initialUser }: DashboardClientLayoutProps) {
  const { user, loading } = useCurrentUser(initialUser);

  if (loading) {
    return <AuthLoadingFallback variant="inline" message="Loading user..." />;
  }

  return (
    <AuthContextProvider initialUser={user}>
      <SyncContextProvider>
        <DashboardContent>{children}</DashboardContent>
      </SyncContextProvider>
    </AuthContextProvider>
  );
}
