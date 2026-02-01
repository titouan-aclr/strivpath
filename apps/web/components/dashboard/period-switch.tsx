'use client';

import { cn } from '@/lib/utils';

export interface PeriodOption {
  value: string;
  label: string;
}

export interface PeriodSwitchProps {
  options: PeriodOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PeriodSwitch({ options, value, onChange, className, disabled }: PeriodSwitchProps) {
  return (
    <div
      className={cn('inline-flex items-center rounded-lg bg-muted p-1', className)}
      role="radiogroup"
      aria-label="Period selection"
    >
      {options.map(option => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
