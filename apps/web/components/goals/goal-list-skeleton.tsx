import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface GoalListSkeletonProps {
  count?: number;
}

export function GoalListSkeleton({ count = 6 }: GoalListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading goals" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
