import { getClient } from '@/lib/apollo-client';
import { gql } from '@apollo/client';
import { User } from '@repo/graphql-types';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { setRequestLocale, getTranslations } from 'next-intl/server';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      stravaId
      username
      firstname
      lastname
      city
      country
    }
  }
`;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function IndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');

  const client = getClient();
  const { data } = await client.query<{ users: User[] }>({
    query: GET_USERS,
  });

  if (!data) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{t('title')}</h1>
          <ModeToggle />
        </div>
        <p className="text-destructive">{t('failedToLoadUsers')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <ModeToggle />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <p className="text-lg text-muted-foreground">{t('usersFromApi')}</p>
          <Button variant="outline">{t('demoButton')}</Button>
        </div>

        {data.users.length === 0 ? (
          <p className="text-muted-foreground">{t('noUsers')}</p>
        ) : (
          <ul className="space-y-2">
            {data.users.map(user => (
              <li key={user.id} className="p-4 border rounded-lg bg-card text-card-foreground">
                <strong className="text-primary">{user.username || t('userLabel', { id: user.stravaId })}</strong>
                {user.firstname && user.lastname && (
                  <span className="text-muted-foreground">
                    {' '}
                    - {user.firstname} {user.lastname}
                  </span>
                )}
                {user.city && user.country && (
                  <span className="text-sm text-muted-foreground">
                    {' '}
                    ({user.city}, {user.country})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
