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
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

type LogoutData = {
  logout: boolean;
};

export function UserMenu() {
  const t = useTranslations('layout.userMenu');
  const router = useRouter();
  const [logoutMutation] = useMutation<LogoutData>(LOGOUT_MUTATION);

  const user = {
    firstname: 'John',
    lastname: 'Doe',
    profileImageUrl: null,
  };

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profileImageUrl || undefined} />
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
