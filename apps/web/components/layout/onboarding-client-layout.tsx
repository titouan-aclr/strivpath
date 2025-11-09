'use client';

import { AuthContextProvider } from '@/lib/auth/context';
import { OnboardingLayout } from '@/components/layout/onboarding-layout';
import type { User } from '@/lib/graphql';

interface OnboardingClientLayoutProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function OnboardingClientLayout({ children, initialUser }: OnboardingClientLayoutProps) {
  return (
    <AuthContextProvider initialUser={initialUser}>
      <OnboardingLayout>{children}</OnboardingLayout>
    </AuthContextProvider>
  );
}
