'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ModeToggle } from '@/components/mode-toggle';
import { StepProgressBar } from '@/components/onboarding/step-progress-bar';

const STEPS = [
  { path: '/onboarding', label: 'onboarding.steps.selectSports' },
  { path: '/sync', label: 'onboarding.steps.syncActivities' },
  { path: '/onboarding-complete', label: 'onboarding.steps.confirmation' },
];

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();

  const pathnameWithoutLocale = pathname.replace(/^\/(en|fr)/, '');
  const currentStepIndex = STEPS.findIndex(step => pathnameWithoutLocale === step.path);

  return (
    <div className="flex min-h-screen flex-col bg-pattern-topo-subtle">
      <header className="flex items-center justify-between p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Image src="/logo.svg" alt="StrivPath logo" width={28} height={28} className="h-7 w-7" />
          {t('common.appName')}
        </h1>
        <ModeToggle />
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-4">
        <StepProgressBar steps={STEPS} currentStepIndex={currentStepIndex} />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">{children}</main>
    </div>
  );
}
