import { Suspense } from 'react';
import { requireAuth } from './dal';
import { AuthContextProvider } from './context';
import { getClient } from '../apollo-client';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { getFragmentData, type User } from '@/lib/graphql';

export async function AuthProvider({ children }: { children: React.ReactNode }) {
  await requireAuth();

  const { data } = await getClient().query({
    query: CurrentUserDocument,
    errorPolicy: 'all',
  });

  const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContextProvider initialUser={userFragment as User | null}>{children}</AuthContextProvider>
    </Suspense>
  );
}
