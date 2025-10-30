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
import { Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation } from '@/lib/graphql';
import { LogoutDocument, type LogoutMutation } from '@/gql/graphql';
import { useAuth } from '@/lib/auth/context';

export function UserMenu() {
  const t = useTranslations('layout.userMenu');
  const router = useRouter();
  const { user } = useAuth();
  const [logoutMutation] = useMutation<LogoutMutation>(LogoutDocument);

  const handleLogout = () => {
    void logoutMutation()
      .then(() => {
        router.push('/login');
        router.refresh();
      })
      .catch((err: Error) => {
        console.error('Logout error:', err.message);
      });
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profile || user.profileMedium || undefined} />
            <AvatarFallback>
              {user.firstname?.[0]}
              {user.lastname?.[0]}
            </AvatarFallback>
          </Avatar>
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
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
