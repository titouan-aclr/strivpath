'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { PoweredByStrava } from '@/components/strava/powered-by-strava';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
          <PoweredByStrava />
        </main>
      </div>
    </div>
  );
}
