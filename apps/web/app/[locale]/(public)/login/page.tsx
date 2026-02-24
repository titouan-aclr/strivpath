import { setRequestLocale } from 'next-intl/server';
import { getClient } from '@/lib/apollo-client';
import { StravaAuthUrlDocument, type StravaAuthUrlQuery } from '@/gql/graphql';
import { validateRedirect } from '@/lib/auth/redirect-to-login';
import { redirectIfAuthenticated } from '@/lib/auth/dal';
import { PublicPageHeader } from '@/components/layout/public-page-header';
import { LegalLinksFooter } from '@/components/layout/legal-links-footer';
import { LoginCard } from '@/components/auth/login-card';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; redirect?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  await redirectIfAuthenticated();

  const { locale } = await params;
  const { error, redirect } = await searchParams;
  setRequestLocale(locale);

  const validatedRedirect = redirect ? validateRedirect(redirect) : undefined;

  const client = getClient();
  const { data } = await client.query<StravaAuthUrlQuery>({
    query: StravaAuthUrlDocument,
    variables: { redirect: validatedRedirect },
  });

  return (
    <div className="bg-pattern-topo-subtle flex min-h-screen flex-col">
      <PublicPageHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <LoginCard stravaAuthUrl={data?.stravaAuthUrl ?? '#'} error={error} />
      </main>
      <LegalLinksFooter />
    </div>
  );
}
