'use client';

import { AuthProvider } from '@/lib/auth/provider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { useAuthToast } from '@/lib/auth/use-auth-toast';
import { useTranslations } from 'next-intl';

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

export default function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
