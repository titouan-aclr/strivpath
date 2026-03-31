import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityListSkeletonProps {
  count?: number;
}

export function ActivityListSkeleton({ count = 5 }: ActivityListSkeletonProps) {
  return (
    <div className="space-y-4" aria-label="Loading activities" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="flex gap-4 pt-3 border-t">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}
