'use client';

import { AuthContextProvider } from '@/lib/auth/context';
import { OnboardingLayout } from '@/components/layout/onboarding-layout';
import { AuthLoadingFallback } from '@/components/auth/auth-loading-fallback';
import type { User } from '@/lib/graphql';

interface OnboardingClientLayoutProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function OnboardingClientLayout({ children, initialUser }: OnboardingClientLayoutProps) {
  const showSpinner = initialUser === null;

  return (
    <AuthContextProvider initialUser={initialUser}>
      {showSpinner ? (
        <AuthLoadingFallback variant="inline" message="Loading your profile..." />
      ) : (
        <OnboardingLayout>{children}</OnboardingLayout>
      )}
    </AuthContextProvider>
  );
}
