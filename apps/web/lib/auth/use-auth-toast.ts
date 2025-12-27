'use client';

export function useAuthToast() {
  // No longer needed - useCurrentUser handles final errors with redirect
  // RefreshLink handles intermediate retries transparently
  // Keeping empty hook to avoid breaking existing code that calls it
}
