export function validateRedirect(redirect: string | null | undefined): string {
  if (!redirect) return '/dashboard';

  if (!redirect.startsWith('/')) return '/dashboard';

  if (redirect === '/login' || redirect.startsWith('/login?')) return '/dashboard';

  if (redirect.startsWith('/api')) return '/dashboard';

  return redirect;
}
