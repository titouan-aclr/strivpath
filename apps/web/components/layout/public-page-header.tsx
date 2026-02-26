import Image from 'next/image';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ModeToggle } from '@/components/mode-toggle';

export function PublicPageHeader() {
  return (
    <header className="flex items-center justify-between p-6">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold">
        <Image src="/logo.svg" alt="StrivPath logo" width={28} height={28} className="h-7 w-7" />
        StrivPath
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
    </header>
  );
}
