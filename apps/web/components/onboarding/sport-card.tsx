'use client';

import { type LucideIcon, Check } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SportType } from '@/gql/graphql';

interface SportCardProps {
  sport: SportType;
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  disabled: boolean;
  maxReached: boolean;
  onToggle: () => void;
}

export function SportCard({
  title,
  description,
  icon: Icon,
  selected,
  disabled,
  maxReached,
  onToggle,
}: SportCardProps) {
  const isInteractive = !disabled && !maxReached;

  return (
    <Card
      role="button"
      aria-pressed={selected}
      aria-disabled={disabled || maxReached}
      aria-label={`${title}: ${description}`}
      tabIndex={isInteractive ? 0 : -1}
      onClick={isInteractive ? onToggle : undefined}
      onKeyDown={e => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'relative transition-all duration-200',
        isInteractive && 'cursor-pointer hover:scale-105 hover:shadow-lg',
        selected && 'selected-ring',
        maxReached && !selected && 'opacity-50 cursor-not-allowed',
        disabled && 'opacity-60 pointer-events-none',
      )}
    >
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className={cn('rounded-full p-4 transition-colors', selected ? 'bg-primary text-white' : 'bg-muted')}>
            <Icon className="h-8 w-8" aria-hidden="true" />
          </div>
        </div>
        {selected && <Check className="absolute top-4 right-4 h-5 w-5 text-primary" aria-label="Selected" />}
      </CardHeader>
      <CardContent className="text-center space-y-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
