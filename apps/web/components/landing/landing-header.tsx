'use client';

import { Menu } from 'lucide-react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  isAuthenticated: boolean;
}

const NAV_LINK_KEYS = [
  { href: '#features', key: 'features' as const },
  { href: '#how-it-works', key: 'howItWorks' as const },
] as const;

export function LandingHeader({ isAuthenticated }: LandingHeaderProps) {
  const t = useTranslations('landing.header');
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', y => {
    setIsScrolled(y > 50);
  });

  const ctaLabel = isAuthenticated ? t('openDashboard') : t('getStarted');
  const ctaHref = isAuthenticated ? '/dashboard' : '/login';

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <div
        className={cn(
          'flex h-18 w-full max-w-5xl items-center justify-between rounded-2xl border px-4 transition-all duration-300',
          isScrolled
            ? 'backdrop-blur-lg bg-background/80 border-border/60 shadow-lg'
            : 'backdrop-blur-sm bg-background/70 border-border/30 shadow-sm',
        )}
      >
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image src="/logo.svg" alt="StrivPath logo" width={24} height={24} className="h-7 w-7" />
          StrivPath
        </Link>

        <nav className="hidden md:flex items-center gap-5" aria-label="Main navigation">
          {NAV_LINK_KEYS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
          <a
            href="https://github.com/titouan-aclr/strivpath"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <span aria-hidden="true">★</span>
            {t('openSource')}
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
          <Button asChild size="sm" className="h-8 px-3 text-xs">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-1.5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('openMenu')} className="h-8 w-8">
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col">
              <SheetTitle className="sr-only">{t('mobileNavTitle')}</SheetTitle>
              <nav className="flex flex-col gap-4 pt-8" aria-label="Mobile navigation">
                {NAV_LINK_KEYS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(link.key)}
                  </Link>
                ))}
                <a
                  href="https://github.com/titouan-aclr/strivpath"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-base text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span aria-hidden="true">★</span>
                  {t('openSource')}
                </a>
                <div className="mt-4 border-t border-border pt-4">
                  <Button asChild className="w-full rounded-xl">
                    <Link href={ctaHref} onClick={() => setMobileOpen(false)}>
                      {ctaLabel}
                    </Link>
                  </Button>
                </div>
              </nav>
              <div className="mt-auto flex justify-center gap-2 pb-2">
                <LanguageSwitcher />
                <ModeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
