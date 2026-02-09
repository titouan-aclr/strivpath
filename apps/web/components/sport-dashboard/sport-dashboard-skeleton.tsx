'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SportDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading sport dashboard" aria-busy="true">
      <HeaderSkeleton />
      <PerformanceOverviewSkeleton />
      <ProgressionChartSkeleton />
      <GoalsSkeleton />
      <RecordsSkeleton />
      <RecentActivitiesSkeleton />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-11 w-11 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function PerformanceOverviewSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressionChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-2 mt-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function GoalsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-[150px] w-full rounded-lg" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecordsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-28" />
              <div className="ml-auto flex items-center gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-24 hidden sm:block" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivitiesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="flex gap-3 mb-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-4 w-2/5" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
