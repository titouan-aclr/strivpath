import { getClient } from '../lib/apollo-client';
import { gql } from '@apollo/client';
import { User } from '@repo/graphql-types';

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
      <div style={{ padding: '2rem' }}>
        <h1>Stravanalytics</h1>
        <p>Failed to load users</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Stravanalytics</h1>
      <p>Users from GraphQL API:</p>

      {data.users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul>
          {data.users.map(user => (
            <li key={user.id}>
              <strong>{user.username || `User ${user.stravaId}`}</strong>
              {user.firstname && user.lastname && (
                <span>
                  {' '}
                  - {user.firstname} {user.lastname}
                </span>
              )}
              {user.city && user.country && (
                <span>
                  {' '}
                  ({user.city}, {user.country})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
