'use client';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ModeToggle } from '@/components/mode-toggle';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(Boolean);

  const getBreadcrumbText = () => {
    if (pathSegments.length === 0) {
      return 'Dashboard';
    }

    if (pathSegments.length === 2 && /^\d+$/.test(pathSegments[1])) {
      const singularMap: Record<string, string> = {
        activities: 'Activity',
        goals: 'Goal',
        badges: 'Badge',
      };
      const section = pathSegments[0];
      const id = pathSegments[1];
      const label = singularMap[section] || section;
      return `${label.charAt(0).toUpperCase() + label.slice(1)} ${id}`;
    }

    return pathSegments.map(segment => segment.replace(/-/g, ' ')).join(' / ');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="capitalize">{getBreadcrumbText()}</span>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
    </header>
  );
}
