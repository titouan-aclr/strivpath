'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMutation } from '@/lib/graphql';
import { LogoutDocument, type LogoutMutation } from '@/gql/graphql';

interface UseLogoutResult {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useLogout(): UseLogoutResult {
  const router = useRouter();
  const [logoutMutation] = useMutation<LogoutMutation>(LogoutDocument);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await logoutMutation();
      router.push('/login');
      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Logout failed');
      setError(error);
      console.error('Logout error:', error.message);
      toast.error('Failed to logout', {
        description: 'Please try again or refresh the page.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [logoutMutation, router]);

  return {
    logout,
    isLoading,
    error,
  };
}
