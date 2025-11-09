'use client';

import { useTranslations } from 'next-intl';
import { AuthContextProvider } from '@/lib/auth/context';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthToast } from '@/lib/auth/use-auth-toast';
import type { User } from '@/lib/graphql';

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  initialUser: User | null;
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth.error');

  useAuthToast();

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
  return (
    <AuthContextProvider initialUser={initialUser}>
      <DashboardContent>{children}</DashboardContent>
    </AuthContextProvider>
  );
}
