import { getClient } from '../lib/apollo-client';
import { gql } from '@apollo/client';
import { User } from '@repo/graphql-types';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';

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

export default async function IndexPage() {
  const client = getClient();
  const { data } = await client.query<{ users: User[] }>({
    query: GET_USERS,
  });

  if (!data) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Stravanalytics</h1>
          <ModeToggle />
        </div>
        <p className="text-destructive">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Stravanalytics</h1>
        <ModeToggle />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <p className="text-lg text-muted-foreground">Users from GraphQL API:</p>
          <Button variant="outline">Demo Button</Button>
        </div>

        {data.users.length === 0 ? (
          <p className="text-muted-foreground">No users found</p>
        ) : (
          <ul className="space-y-2">
            {data.users.map(user => (
              <li key={user.id} className="p-4 border rounded-lg bg-card text-card-foreground">
                <strong className="text-primary">{user.username || `User ${user.stravaId}`}</strong>
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
