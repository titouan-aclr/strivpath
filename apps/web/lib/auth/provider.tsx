import { Suspense } from 'react';
import { requireAuth } from './dal';
import { AuthContextProvider } from './context';

export async function AuthProvider({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </Suspense>
  );
}
