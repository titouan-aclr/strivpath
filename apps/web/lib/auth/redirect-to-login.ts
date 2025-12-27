export function validateRedirect(redirect: string | null | undefined): string {
  if (!redirect) return '/dashboard';

  if (!redirect.startsWith('/')) return '/dashboard';

  if (redirect === '/login' || redirect.startsWith('/login?')) return '/dashboard';

  if (redirect.startsWith('/api')) return '/dashboard';

  return redirect;
}

export function getLoginUrl(error?: string): string {
  const loginPath = '/login';
  if (!error) return loginPath;

  const params = new URLSearchParams({ error });
  return `${loginPath}?${params.toString()}`;
}

let isRedirecting = false;

export function redirectToLogin(error?: string): void {
  if (typeof window === 'undefined') return;
  if (isRedirecting) return;

  isRedirecting = true;
  window.location.href = getLoginUrl(error);
}
