import { Suspense } from 'react';
import { AuthProvider } from '@/lib/auth/provider';
import { OnboardingClientLayout } from '@/components/layout/onboarding-client-layout';
import { AuthLoadingFallback } from '@/components/auth/auth-loading-fallback';

export default function OnboardingLayoutPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoadingFallback variant="fullscreen" message="Loading your profile..." />}>
      <AuthProvider>
        {user => <OnboardingClientLayout initialUser={user}>{children}</OnboardingClientLayout>}
      </AuthProvider>
    </Suspense>
  );
}
