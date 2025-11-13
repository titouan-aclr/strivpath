import { redirect } from 'next/navigation';
import { requireAuth } from './dal';
import { fetchCurrentUserWithRetry } from './fetch-user';
import type { User } from '@/lib/graphql';

interface AuthProviderProps {
  children: (user: User | null) => React.ReactNode;
}

export async function AuthProvider({ children }: AuthProviderProps) {
  await requireAuth();

  try {
    const user = await fetchCurrentUserWithRetry();

    if (user) {
      console.info('[SSR Auth] Provider initialized with user', { userId: user.id });
    } else {
      console.warn('[SSR Auth] Provider initialized without user - client will refresh');
    }

    return children(user);
  } catch (error) {
    console.error('[SSR Auth] Critical error during initialization', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    redirect('/login?error=network_error');
  }
}
