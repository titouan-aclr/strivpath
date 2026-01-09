'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/context';
import { useAuthFeedback } from '@/lib/auth/use-auth-feedback';
import { useLogout } from '@/lib/auth/use-logout';
import { AuthStatusIndicator } from '@/components/auth/auth-status-indicator';

export function UserMenu() {
  const t = useTranslations('layout.userMenu');
  const router = useRouter();
  const { user } = useAuth();
  const { showRefreshing } = useAuthFeedback();
  const { logout, isLoading } = useLogout();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profile || user.profileMedium || undefined} />
              <AvatarFallback>
                {user.firstname?.[0] ?? '?'}
                {user.lastname?.[0] ?? ''}
              </AvatarFallback>
            </Avatar>
            {showRefreshing && (
              <div className="absolute -top-1 -right-1" title={t('refreshing')}>
                <AuthStatusIndicator variant="badge" message={t('refreshing')} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">
              {user.firstname} {user.lastname}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          {t('settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void handleLogout();
          }}
          disabled={isLoading}
          aria-busy={isLoading}
          className="text-destructive"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t('loggingOut')}</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
