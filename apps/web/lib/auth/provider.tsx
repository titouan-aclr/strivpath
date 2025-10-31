import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from './dal';
import { AuthContextProvider } from './context';
import { getClient } from '../apollo-client';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { getFragmentData, type User } from '@/lib/graphql';

export async function AuthProvider({ children }: { children: React.ReactNode }) {
  await requireAuth();

  try {
    const { data } = await getClient().query({
      query: CurrentUserDocument,
      errorPolicy: 'none',
    });

    const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <AuthContextProvider initialUser={userFragment as User | null}>{children}</AuthContextProvider>
      </Suspense>
    );
  } catch {
    redirect('/login?error=session_expired');
  }
}
