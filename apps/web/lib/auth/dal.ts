import { cookies } from 'next/headers';
import { redirectToLoginServer, redirectToDashboard } from './redirect-server';

export async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('Authentication');
  return !!authToken;
}

export async function requireAuth(errorReason?: string): Promise<void> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('Authentication');
  const refreshToken = cookieStore.get('RefreshToken');

  if (!authToken && !refreshToken) {
    redirectToLoginServer(errorReason);
  }
}

export async function redirectIfAuthenticated(): Promise<void> {
  const isAuthenticated = await verifyAuth();
  if (isAuthenticated) {
    redirectToDashboard();
  }
}
