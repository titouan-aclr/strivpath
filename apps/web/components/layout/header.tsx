'use client';

import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Header() {
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean).slice(1);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2 text-sm">
        {pathSegments.length > 0 ? (
          pathSegments.map((segment, index) => (
            <span key={index}>
              <span className="capitalize">{segment.replace(/-/g, ' ')}</span>
              {index < pathSegments.length - 1 && <span className="mx-2 text-muted-foreground">/</span>}
            </span>
          ))
        ) : (
          <span className="capitalize">Dashboard</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
    </header>
  );
}
