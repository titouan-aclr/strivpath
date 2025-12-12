'use client';

import { useTranslations } from 'next-intl';

interface Step {
  path: string;
  label: string;
}

interface StepProgressBarProps {
  steps: Step[];
  currentStepIndex: number;
}

export function StepProgressBar({ steps, currentStepIndex }: StepProgressBarProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.path} className="flex items-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 relative z-10 ${
                index <= currentStepIndex ? 'bg-strava-orange text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-2 w-32 -mx-1 transition-colors duration-300 ${
                  index < currentStepIndex ? 'bg-strava-orange' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {currentStepIndex >= 0 && currentStepIndex < steps.length && (
        <p className="text-center text-sm text-muted-foreground">{t(steps[currentStepIndex].label)}</p>
      )}
    </div>
  );
}
