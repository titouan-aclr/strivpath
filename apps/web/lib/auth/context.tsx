'use client';

import { createContext, useContext } from 'react';
import { useSuspenseQuery } from '@apollo/client/react';
import { type User, getFragmentData } from '@/lib/graphql';
import { CurrentUserDocument, UserFullInfoFragmentDoc } from '@/gql/graphql';

interface AuthContextValue {
  user: User | null;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data, refetch } = useSuspenseQuery(CurrentUserDocument);

  const userFragment = data.currentUser ? getFragmentData(UserFullInfoFragmentDoc, data.currentUser) : null;

  const handleRefetch = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider value={{ user: userFragment as User | null, refetch: handleRefetch }}>
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
