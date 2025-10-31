import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from './dal';
import { AuthContextProvider } from './context';
import { getClient } from '../apollo-client';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { getFragmentData, type User } from '@/lib/graphql';
import { AuthLoadingFallback } from '@/components/auth/auth-loading-fallback';

export async function AuthProvider({ children }: { children: React.ReactNode }) {
  await requireAuth();

  try {
    const { data } = await getClient().query({
      query: CurrentUserDocument,
      errorPolicy: 'none',
    });

    const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

    return (
      <Suspense fallback={<AuthLoadingFallback />}>
        <AuthContextProvider initialUser={userFragment as User | null}>{children}</AuthContextProvider>
      </Suspense>
    );
  } catch (error) {
    console.error('Auth provider error:', error instanceof Error ? error.message : 'Unknown error');
    redirect('/login?error=session_expired');
  }
}
