'use client';

import { usePathname } from '@/i18n/navigation';
import { PublicPageHeader } from '@/components/layout/public-page-header';
import { StepProgressBar } from '@/components/onboarding/step-progress-bar';

const STEPS = [
  { path: '/onboarding', label: 'onboarding.steps.selectSports' },
  { path: '/sync', label: 'onboarding.steps.syncActivities' },
  { path: '/onboarding-complete', label: 'onboarding.steps.confirmation' },
];

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentStepIndex = STEPS.findIndex(step => pathname === step.path);

  return (
    <div className="flex min-h-screen flex-col bg-pattern-topo-subtle">
      <PublicPageHeader />

      <div className="mx-auto w-full max-w-5xl px-6 py-4">
        <StepProgressBar steps={STEPS} currentStepIndex={currentStepIndex} />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">{children}</main>
    </div>
  );
}
