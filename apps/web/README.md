# Web - Next.js Frontend

Next.js 15 frontend application for Stravanalytics with Apollo Client for GraphQL data fetching.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: React 19
- **GraphQL Client**: Apollo Client with `@apollo/experimental-nextjs-app-support`
- **Module System**: ESM (native)
- **Testing**: Vitest + @testing-library/react + Playwright
- **Styling**: TailwindCSS (to be configured)
- **TypeScript**: Strict mode

## Key Features

- Server-side GraphQL queries via Apollo Client
- Next.js 15 App Router architecture
- Type-safe GraphQL integration using shared `@repo/graphql-types`
- MSW (Mock Service Worker) for GraphQL mocking in tests
- Playwright for end-to-end testing

## Module System

Uses **ESM** (ECMAScript Modules):

- `"type": "module"` in package.json
- Native Next.js 15 ESM support
- Modern import/export syntax

## Project Structure

```
app/
├── layout.tsx        # Root layout
└── page.tsx          # Home page

lib/
└── apollo-client.ts  # Apollo Client configuration

mocks/
├── handlers.ts       # MSW GraphQL handlers
└── server.ts         # MSW server setup

__tests__/
└── ...               # Component tests
```

## Development

### Prerequisites

- API server running at http://localhost:3011
- Environment variables configured in `.env.local`

### Running

```bash
# From root
pnpm --filter web dev

# Or from apps/web
pnpm dev
```

Server runs at: http://localhost:3000

### Hot Reload

Next.js automatically reloads on file changes. Shared workspace packages (`@repo/graphql-types`) are also watched in dev mode.

## GraphQL Integration

### Apollo Client Setup

Server-side client configured in `lib/apollo-client.ts`:

```typescript
import { getClient } from '@/lib/apollo-client';

export default async function Page() {
  const { data } = await getClient().query({
    query: GET_USERS_QUERY,
  });

  return <div>{/* Render data */}</div>;
}
```

Uses `@apollo/experimental-nextjs-app-support` for Next.js App Router compatibility.

### Shared Types

GraphQL types imported from `@repo/graphql-types`:

```typescript
import { User } from '@repo/graphql-types';
```

After modifying shared types, rebuild:

```bash
pnpm --filter @repo/graphql-types build
```

## Testing

### Unit/Component Tests (Vitest)

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:cov          # With coverage
```

Uses:

- **Vitest** - Fast test runner (ESM-native)
- **@testing-library/react** - Component testing utilities
- **MSW** - GraphQL API mocking

Example:

```typescript
import { render, screen } from '@testing-library/react';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

```bash
pnpm test:e2e
```

Playwright configuration in `playwright.config.ts`.

### GraphQL Mocking (MSW)

Handlers defined in `mocks/handlers.ts`:

```typescript
import { graphql, HttpResponse } from 'msw';

export const handlers = [
  graphql.query('GetUsers', () => {
    return HttpResponse.json({
      data: { users: [{ id: 1, username: 'test' }] },
    });
  }),
];
```

MSW server automatically starts via `vitest.setup.ts`.

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_GRAPHQL_URL="http://localhost:3011/graphql"
```

## Building

```bash
pnpm build
```

Outputs to `.next/` directory.

Production build can be started with:

```bash
pnpm start
```

## Scripts

- `dev` - Start dev server (port 3000)
- `build` - Create production build
- `start` - Start production server
- `test` - Run unit tests
- `test:e2e` - Run Playwright e2e tests
- `test:cov` - Generate coverage report
- `lint` - Run ESLint

## Code Quality

- **TypeScript strict mode** enabled
- **ESLint** with Next.js rules
- **Prettier** for code formatting
- **No code comments** - self-documenting code only

## Apollo Client Configuration

- Uses `registerApolloClient` for server-side queries
- No client-side state management yet (to be added)
- Query results are cached by Next.js automatically

## App Router Patterns

### Server Components (default)

```typescript
export default async function Page() {
  const { data } = await getClient().query({ query: MY_QUERY });
  return <div>{data.field}</div>;
}
```

### Client Components

```typescript
'use client';

import { useSuspenseQuery } from '@apollo/client';

export function MyComponent() {
  const { data } = useSuspenseQuery(MY_QUERY);
  return <div>{data.field}</div>;
}
```

## Next Steps

- Configure TailwindCSS
- Add authentication flow (Strava OAuth)
- Implement activity visualization components
- Add client-side Apollo Client for interactive features
