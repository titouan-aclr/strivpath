'use client';

import { createContext, useContext, useState } from 'react';
import type { User } from '@/lib/graphql';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthContextProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function AuthContextProvider({ children, initialUser }: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
}
