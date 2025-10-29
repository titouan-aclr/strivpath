'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ModeToggle } from '@/components/mode-toggle';

const STEPS = [
  { path: '/onboarding', label: 'onboarding.steps.selectSports' },
  { path: '/sync', label: 'onboarding.steps.syncActivities' },
];

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();

  const pathnameWithoutLocale = pathname.replace(/^\/(en|fr)/, '');
  const currentStepIndex = STEPS.findIndex(step => pathnameWithoutLocale === step.path);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
        <ModeToggle />
      </header>

      <div className="mx-auto w-full max-w-md px-6 py-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.path} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  index <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-1 w-16 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        {currentStepIndex >= 0 && (
          <p className="mt-2 text-center text-sm text-muted-foreground">{t(STEPS[currentStepIndex].label)}</p>
        )}
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-6 py-12">{children}</main>
    </div>
  );
}
