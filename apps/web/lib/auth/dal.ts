import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('Authentication')?.value;
  return !!token;
}

export async function requireAuth(errorReason?: string): Promise<void> {
  const isAuthenticated = await verifyAuth();
  if (!isAuthenticated) {
    const errorParam = errorReason ? `?error=${errorReason}` : '';
    redirect(`/login${errorParam}`);
  }
}

export async function redirectIfAuthenticated(): Promise<void> {
  const isAuthenticated = await verifyAuth();
  if (isAuthenticated) {
    redirect('/dashboard');
  }
}
