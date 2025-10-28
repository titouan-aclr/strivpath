import { AuthProvider } from '@/lib/auth/provider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardLayoutPage({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
