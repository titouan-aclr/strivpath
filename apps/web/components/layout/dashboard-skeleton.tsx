import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 border-r bg-muted/40">
        <div className="flex h-full flex-col gap-2 p-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-px w-full" />
          <div className="flex flex-col gap-2 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="mt-auto">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b bg-background">
          <div className="flex h-16 items-center justify-between px-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    </div>
  );
}
