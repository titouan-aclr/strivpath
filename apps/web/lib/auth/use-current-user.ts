'use client';

import { useEffect } from 'react';
import { useQuery, getFragmentData, type User } from '@/lib/graphql';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';
import { redirectToLogin } from './redirect-to-login';
import { AUTH_CONFIG } from './auth.config';

interface UseCurrentUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'string' && typeof user.username === 'string';
}

export function useCurrentUser(initialUser: User | null): UseCurrentUserResult {
  const { data, loading, error } = useQuery(CurrentUserDocument, {
    skip: !!initialUser,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  });

  const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;
  const user = userFragment && isUser(userFragment) ? userFragment : initialUser;

  useEffect(() => {
    if (error && !loading && !user) {
      redirectToLogin(AUTH_CONFIG.redirectReasons.sessionExpired);
    }
  }, [error, loading, user]);

  return { user, loading, error: error || null };
}
