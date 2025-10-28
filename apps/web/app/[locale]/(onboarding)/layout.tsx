import { AuthProvider } from '@/lib/auth/provider';
import { OnboardingLayout } from '@/components/layout/onboarding-layout';

export default function OnboardingLayoutPage({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingLayout>{children}</OnboardingLayout>
    </AuthProvider>
  );
}
