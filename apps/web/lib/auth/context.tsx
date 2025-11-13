'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { type User, getFragmentData } from '@/lib/graphql';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';

interface AuthContextValue {
  user: User | null;
  refetch: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  isRefreshing: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthContextProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function AuthContextProvider({ children, initialUser }: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(initialUser === null);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refetchQuery] = useLazyQuery(CurrentUserDocument);

  useEffect(() => {
    if (initialUser === null && !isRefreshing) {
      handleRefetch().catch(err => {
        console.error('[Client Auth] Token refresh failed - redirecting to login', {
          error: err instanceof Error ? err.message : 'Unknown',
        });
        window.location.href = '/login?error=session_expired';
      });
    }
  }, [initialUser, isRefreshing]);

  const handleRefetch = useCallback(async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    setError(null);

    try {
      const { data } = await refetchQuery();
      const userFragment = data?.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

      setUser(userFragment as User | null);

      if (!userFragment) {
        console.warn('[Client Auth] No user returned after refresh - session expired');
        throw new Error('No user after refresh - session expired');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during refetch');
      console.error('[Client Auth] Refetch failed', {
        error: error.message,
      });
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [refetchQuery]);

  return (
    <AuthContext.Provider value={{ user, refetch: handleRefetch, isLoading, error, isRefreshing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
}
