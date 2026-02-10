# Web - Next.js Frontend

Next.js 16 frontend application for StrivPath with modern UI and complete authentication flow.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **GraphQL Client**: Apollo Client with SSR/CSR streaming support
- **UI Framework**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS v4 with CSS variables
- **Theme System**: next-themes (light/dark/system modes)
- **Internationalization**: next-intl (EN/FR support with type-safe translations)
- **Code Generation**: GraphQL Code Generator with fragment masking
- **Module System**: ESM (native)
- **Testing**: Vitest + @testing-library/react + Playwright
- **TypeScript**: Strict mode enabled

## Key Features

- **Modern UI**: shadcn/ui components with Tailwind CSS v4
- **Type-Safe GraphQL**: Auto-generated types with fragment masking
- **SSR/CSR Support**: Apollo Client with Next.js App Router streaming
- **Authentication**: Secure JWT-based auth with httpOnly cookies
- **Theme System**: Light/dark mode with system preference detection
- **Internationalization**: Full i18n support (EN/FR) with next-intl
- **Testing**: Comprehensive unit and E2E testing setup

## Module System

Uses **ESM** (ECMAScript Modules):

- `"type": "module"` in package.json
- Native Next.js 15 ESM support
- Modern import/export syntax

## Project Structure

```
app/
├── layout.tsx                    # Root layout (minimal wrapper)
└── [locale]/                     # Internationalized routes
    ├── layout.tsx                # Locale layout with providers
    ├── (public)/                 # Public routes (login, home)
    ├── (onboarding)/             # Onboarding flow
    └── (dashboard)/              # Protected dashboard routes

components/
├── ui/                           # shadcn/ui components
├── providers/                    # React context providers
└── layout/                       # Layout components

lib/
├── apollo-client.ts              # Server-side Apollo Client
├── apollo-wrapper.tsx            # Client-side Apollo Provider
├── graphql.ts                    # GraphQL utilities & type exports
├── auth/                         # Authentication utilities
│   ├── context.tsx               # Auth React context
│   ├── provider.tsx              # Auth provider with server check
│   └── dal.ts                    # Data access layer
└── utils.ts                      # Utility functions

graphql/
├── fragments/                    # GraphQL fragments
├── queries/                      # GraphQL queries
└── mutations/                    # GraphQL mutations

gql/                              # Generated GraphQL types
├── graphql.ts                    # TypedDocumentNode exports
└── fragment-masking.ts           # Fragment masking utilities

i18n/
├── routing.ts                    # Locale routing config
├── request.ts                    # Server-side i18n config
└── navigation.ts                 # Type-safe navigation helpers

messages/
└── en.json                       # English translations

mocks/
├── handlers.ts                   # MSW GraphQL handlers
└── server.ts                     # MSW server setup
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

### Code Generation

GraphQL operations are auto-generated from `.graphql` files:

```bash
pnpm codegen              # Generate types once
pnpm codegen:watch        # Watch mode
pnpm dev:full             # Run codegen + dev server concurrently
```

**Configuration** (`codegen.ts`):

- Schema source: `../api/src/schema.gql`
- Documents: `app/**`, `components/**`, `lib/**`, `graphql/**/*.graphql`
- Output: `gql/` directory with TypedDocumentNode types
- Fragment masking: Enabled with `getFragmentData` unmask function
- Type mappers: Map to `@repo/graphql-types` for shared types

### Apollo Client Setup

**Server Components** (SSR):

```typescript
import { getClient } from '@/lib/apollo-client';
import { MyQueryDocument } from '@/gql/graphql';

export default async function Page() {
  const { data } = await getClient().query({
    query: MyQueryDocument,
  });
  return <div>{data.field}</div>;
}
```

**Client Components** (CSR):

```typescript
'use client';

import { useSuspenseQuery } from '@apollo/client/react';
import { MyQueryDocument } from '@/gql/graphql';

export function MyComponent() {
  const { data } = useSuspenseQuery(MyQueryDocument);
  return <div>{data.field}</div>;
}
```

### Fragment Masking

Fragments are masked by default for better encapsulation:

```typescript
import { getFragmentData } from '@/lib/graphql';
import { UserFullInfoFragmentDoc } from '@/gql/graphql';

const userFragment = getFragmentData(UserFullInfoFragmentDoc, data.currentUser);
```

### Type Safety

GraphQL types are mapped to shared backend types:

```typescript
import { User, Activity } from '@repo/graphql-types';
```

This ensures type consistency between frontend and backend.

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

## UI Components

### shadcn/ui Integration

shadcn/ui is configured with the "new-york" style:

```bash
npx shadcn@latest add button      # Add specific component
```

**Installed components:**

- Button, Card, Dialog, Dropdown Menu
- Avatar, Badge, Input, Label
- Progress, Separator, Skeleton, Tabs

**Configuration** (`components.json`):

- Style: `new-york`
- Base color: `neutral`
- CSS variables: Enabled
- Tailwind v4 compatible

### Theme System

Dark/light theme powered by `next-themes`:

```typescript
import { ThemeProvider } from '@/components/providers/theme-provider';

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Theme variables are defined in `app/globals.css` using CSS custom properties.

## Internationalization

### next-intl Setup

Type-safe i18n with locale routing:

```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('home');
  return <h1>{t('title')}</h1>;
}
```

**Supported locales:** `en` (default)

**Route structure:**

- `/` → English (default, no prefix)
- `/fr` → French (when implemented)

**Translation files:**

- `messages/en.json` - English translations
- `messages/fr.json` - French translations (to be created)

### Type-Safe Navigation

Use `Link` and `useRouter` from `@/i18n/navigation` for locale-aware routing:

```typescript
import { Link } from '@/i18n/navigation';

<Link href="/dashboard">Dashboard</Link>
```

## Authentication

### Architecture

JWT-based authentication with httpOnly cookies:

1. **Login Flow**: User authenticates via Strava OAuth
2. **Token Storage**: Access/refresh tokens in httpOnly cookies (managed by backend)
3. **Auth Context**: Client-side React context for user state
4. **Route Protection**: Server-side auth checks via `AuthProvider`

### Usage

**Protected Routes:**

```typescript
import { AuthProvider } from '@/lib/auth/provider';

export default function DashboardLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

**Access User:**

```typescript
'use client';

import { useAuth } from '@/lib/auth/context';

export function UserProfile() {
  const { user, refetch } = useAuth();
  return <div>{user.username}</div>;
}
```

## Code Quality

- **TypeScript Strict Mode**: All code fully typed
- **ESLint**: Next.js recommended rules + custom config
- **No Comments**: Self-documenting code only
- **Path Aliases**: Clean imports with `@/` prefix

## Performance

- **SSR/CSR**: Automatic optimization via Next.js App Router
- **Apollo Cache**: Normalized cache with custom merge policies
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
