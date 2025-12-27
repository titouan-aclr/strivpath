'use client';

import { useEffect } from 'react';
import { useQuery, getFragmentData, type User } from '@/lib/graphql';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { redirectToLogin } from './redirect-to-login';

interface UseCurrentUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useCurrentUser(initialUser: User | null): UseCurrentUserResult {
  const { data, loading, error } = useQuery(CurrentUserDocument, {
    skip: !!initialUser,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  const user = data?.currentUser ? (getFragmentData(UserFullInfoFragmentDoc, data.currentUser) as User) : initialUser;

  useEffect(() => {
    if (error && !loading && !user) {
      console.error('[useCurrentUser] Final error after all retries - redirecting to login', {
        error: error.message,
      });
      redirectToLogin('session_expired');
    }
  }, [error, loading, user]);

  return { user, loading, error: error || null };
}
