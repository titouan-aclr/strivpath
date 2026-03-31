import { Suspense } from 'react';
import { AuthProvider } from '@/lib/auth/provider';
import { DashboardClientLayout } from '@/components/layout/dashboard-client-layout';
import { DashboardSkeleton } from '@/components/layout/dashboard-skeleton';

export default function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AuthProvider>
        {user => <DashboardClientLayout initialUser={user}>{children}</DashboardClientLayout>}
      </AuthProvider>
    </Suspense>
  );
}
