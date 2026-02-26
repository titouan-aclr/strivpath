'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { UserMenu } from './user-menu';
import { SidebarNavContent } from './sidebar-nav-content';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const t = useTranslations();

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-64 flex-col gap-0 bg-card p-0">
        <SheetTitle className="sr-only">{t('navigation.mobileNavTitle')}</SheetTitle>

        <div className="p-6">
          <Link href="/dashboard" onClick={close} className="flex items-center gap-2 text-xl font-bold">
            <Image src="/logo.svg" alt="StrivPath logo" width={28} height={28} className="h-7 w-7" />
            {t('common.appName')}
          </Link>
        </div>

        <Separator />

        <SidebarNavContent onNavigate={close} />

        <div className="border-t p-4">
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  );
}
