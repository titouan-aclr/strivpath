'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();

  const pathSegments = pathname.split('/').filter(s => Boolean(s) && !['en', 'fr'].includes(s));

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
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuOpen}
          aria-label={t('navigation.openMenu')}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        <span className="text-sm capitalize">{getBreadcrumbText()}</span>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
    </header>
  );
}
