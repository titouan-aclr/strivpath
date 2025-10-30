import { cookies } from 'next/headers';
import { RefreshTokenDocument } from '@/gql/graphql';

interface RefreshTokenResponse {
  data?: {
    refreshToken?: {
      user: {
        id: string;
      };
    };
  };
  errors?: unknown[];
}

const isValidRefreshResponse = (value: unknown): value is RefreshTokenResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Record<string, unknown>;

  if ('errors' in response) {
    return false;
  }

  if (!('data' in response) || typeof response.data !== 'object' || !response.data) {
    return false;
  }

  const data = response.data as Record<string, unknown>;
  return 'refreshToken' in data && typeof data.refreshToken === 'object' && data.refreshToken !== null;
};

export async function refreshTokenSSR(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('Authentication');
    const refreshCookie = cookieStore.get('RefreshToken');

    if (!refreshCookie) {
      return false;
    }

    const cookieHeader = [
      authCookie ? `Authentication=${authCookie.value}` : null,
      refreshCookie ? `RefreshToken=${refreshCookie.value}` : null,
    ]
      .filter(Boolean)
      .join('; ');

    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3011/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { cookie: cookieHeader }),
      },
      credentials: 'include',
      body: JSON.stringify({
        query: RefreshTokenDocument.loc?.source.body,
        operationName: 'RefreshToken',
      }),
    });

    if (!response.ok) {
      return false;
    }

    const result: unknown = await response.json();

    if (!isValidRefreshResponse(result)) {
      console.error('[SSR RefreshToken] Invalid refresh response format');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SSR RefreshToken] Token refresh failed:', error);
    return false;
  }
}
