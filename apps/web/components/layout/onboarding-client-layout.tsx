'use client';

import { useTranslations } from 'next-intl';
import { AuthContextProvider } from '@/lib/auth/context';
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { OnboardingLayout } from '@/components/layout/onboarding-layout';
import { AuthLoadingFallback } from '@/components/auth/auth-loading-fallback';
import type { User } from '@/lib/graphql';

interface OnboardingClientLayoutProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function OnboardingClientLayout({ children, initialUser }: OnboardingClientLayoutProps) {
  const t = useTranslations('onboarding.error');
  const showSpinner = initialUser === null;

  const errorTranslations = {
    title: t('title'),
    description: t('description'),
    tryAgain: t('tryAgain'),
    goToLogin: t('goToLogin'),
  };

  return (
    <AuthContextProvider initialUser={initialUser}>
      <AuthErrorBoundary translations={errorTranslations}>
        {showSpinner ? (
          <AuthLoadingFallback variant="inline" message="Loading your profile..." />
        ) : (
          <OnboardingLayout>{children}</OnboardingLayout>
        )}
      </AuthErrorBoundary>
    </AuthContextProvider>
  );
}
