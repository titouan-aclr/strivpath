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
    return children(user);
  } catch (error) {
    console.error('[AuthProvider] Failed to initialize auth', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    redirect('/login?error=session_expired');
  }
}
