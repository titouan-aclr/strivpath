import { requireAuth } from './dal';
import { redirectToLoginServer } from './redirect-server';
import { fetchCurrentUserWithRetry } from './fetch-user';
import { AUTH_CONFIG } from './auth.config';
import type { User } from '@/lib/graphql';
import { cookies } from 'next/headers';

interface AuthProviderProps {
  children: (user: User | null) => React.ReactNode;
}

export async function AuthProvider({ children }: AuthProviderProps) {
  await requireAuth();

  const user = await fetchCurrentUserWithRetry();

  if (user) {
    return children(user);
  } else {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('RefreshToken');

    if (refreshToken) {
      return children(null);
    } else {
      redirectToLoginServer(AUTH_CONFIG.redirectReasons.sessionExpired);
    }
  }
}
