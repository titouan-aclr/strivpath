import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type AuthLoadingVariant = 'fullscreen' | 'inline' | 'compact';

interface AuthLoadingFallbackProps {
  variant?: AuthLoadingVariant;
  message?: string;
  className?: string;
}

export function AuthLoadingFallback({
  variant = 'fullscreen',
  message = 'Loading...',
  className,
}: AuthLoadingFallbackProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)} role="status" aria-label={message}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-col items-center gap-4 py-8', className)} role="status" aria-label={message}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex h-screen items-center justify-center bg-background', className)}
      role="status"
      aria-label={message}
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
        </div>
      </div>
    </div>
  );
}
