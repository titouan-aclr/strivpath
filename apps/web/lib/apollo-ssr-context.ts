import { cookies } from 'next/headers';

export interface ApolloServerContext {
  headers: {
    cookie: string;
  };
}

export async function getServerRequestContext(): Promise<ApolloServerContext> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return {
    headers: {
      cookie: cookieHeader,
    },
  };
}
