'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface GoalCreationProgressProps {
  currentStep: 1 | 2;
}

export function GoalCreationProgress({ currentStep }: GoalCreationProgressProps) {
  const t = useTranslations('goals');

  const steps = [
    { number: 1, labelKey: 'create.steps.template' },
    { number: 2, labelKey: 'create.steps.details' },
  ];

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 relative z-10',
                currentStep >= step.number ? 'bg-strava-orange text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-1.5 w-32 -mx-1 transition-colors duration-300',
                  currentStep > step.number ? 'bg-strava-orange' : 'bg-muted',
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">{t(steps[currentStep - 1].labelKey)}</p>
    </div>
  );
}
