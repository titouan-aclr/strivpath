'use client';

import { useTranslations } from 'next-intl';
import { AuthContextProvider } from '@/lib/auth/context';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { OnboardingLayout } from '@/components/layout/onboarding-layout';
import { AuthLoadingFallback } from '@/components/auth/auth-loading-fallback';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import type { User } from '@/lib/graphql';

interface OnboardingClientLayoutProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function OnboardingClientLayout({ children, initialUser }: OnboardingClientLayoutProps) {
  const t = useTranslations('onboarding.error');
  const { user, loading } = useCurrentUser(initialUser);

  const errorTranslations = {
    title: t('title'),
    description: t('description'),
    tryAgain: t('tryAgain'),
    goToLogin: t('goToLogin'),
  };

  if (loading) {
    return <AuthLoadingFallback variant="inline" message="Loading your profile..." />;
  }

  return (
    <AuthContextProvider initialUser={user}>
      <AuthErrorBoundary translations={errorTranslations}>
        <OnboardingLayout>{children}</OnboardingLayout>
      </AuthErrorBoundary>
    </AuthContextProvider>
  );
}
