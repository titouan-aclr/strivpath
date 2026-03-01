'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

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
      <div className="flex w-full max-w-xs items-center mx-auto sm:max-w-sm">
        {steps.flatMap((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCompleted = index < currentStepIndex;

          const circle = (
            <div
              key={`step-${step.path}`}
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-medium transition-colors duration-200',
                'h-8 w-8 text-xs sm:h-10 sm:w-10 sm:text-sm',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {index + 1}
            </div>
          );

          if (index < steps.length - 1) {
            return [
              circle,
              <div
                key={`connector-${step.path}`}
                className={cn(
                  'flex-1 h-1.5 sm:h-2 transition-colors duration-300',
                  isCompleted ? 'bg-primary' : 'bg-muted',
                )}
              />,
            ];
          }

          return [circle];
        })}
      </div>

      {currentStepIndex >= 0 && currentStepIndex < steps.length && (
        <p className="text-center text-sm text-muted-foreground">{t(steps[currentStepIndex].label)}</p>
      )}
    </div>
  );
}
