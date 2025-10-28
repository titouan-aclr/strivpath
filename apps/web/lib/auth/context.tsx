'use client';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

import { createContext, useContext } from 'react';
import { useSuspenseQuery } from '@apollo/client/react';
import { graphql, type User } from '@/lib/graphql';

const CurrentUserDocument = graphql(/* GraphQL */ `
  query CurrentUser {
    currentUser {
      ...UserFullInfo
    }
  }
`);

interface AuthContextValue {
  user: User | null;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data, refetch } = useSuspenseQuery(CurrentUserDocument as any);

  const handleRefetch = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider value={{ user: (data as any).currentUser ?? null, refetch: handleRefetch }}>
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
