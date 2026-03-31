import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AuthStatusVariant = 'badge' | 'inline' | 'compact';

interface AuthStatusIndicatorProps {
  variant?: AuthStatusVariant;
  message?: string;
  className?: string;
}

export function AuthStatusIndicator({
  variant = 'badge',
  message = 'Loading...',
  className,
}: AuthStatusIndicatorProps) {
  if (variant === 'compact') {
    return (
      <Loader2
        className={cn('h-4 w-4 motion-safe:animate-spin text-primary', className)}
        role="status"
        aria-label={message}
        aria-busy="true"
      />
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)} role="status" aria-label={message}>
        <Loader2 className="h-4 w-4 motion-safe:animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'h-5 w-5 p-0 flex items-center justify-center',
        'opacity-90 motion-safe:animate-pulse motion-reduce:opacity-80',
        className,
      )}
      role="status"
      aria-label={message}
      aria-busy="true"
    >
      <Loader2 className="h-3 w-3 motion-safe:animate-spin" aria-hidden="true" />
    </Badge>
  );
}
