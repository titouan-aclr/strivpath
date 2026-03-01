'use client';

import { useState } from 'react';

import { PoweredByStrava } from '@/components/strava/powered-by-strava';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuOpen={() => setMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
          <PoweredByStrava />
        </main>
      </div>
    </div>
  );
}
