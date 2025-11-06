import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from './dal';
import { AuthContextProvider } from './context';
import { AuthLoadingFallback } from '@/components/auth/auth-loading-fallback';
import { fetchCurrentUserWithRetry } from './fetch-user';

export async function AuthProvider({ children }: { children: React.ReactNode }) {
  await requireAuth();

  try {
    const user = await fetchCurrentUserWithRetry();

    return (
      <Suspense fallback={<AuthLoadingFallback />}>
        <AuthContextProvider initialUser={user}>{children}</AuthContextProvider>
      </Suspense>
    );
  } catch (error) {
    console.error('[AuthProvider] Failed to initialize auth', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    redirect('/login?error=session_expired');
  }
}
