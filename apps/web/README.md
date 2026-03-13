# StrivPath Web — Next.js Frontend

Next.js 16 frontend for StrivPath with App Router, Apollo Client (SSR + CSR), automatic token refresh, full internationalization (EN/FR), and a cohesive design system built on shadcn/ui and Tailwind CSS v4.

→ For project overview, screenshots, and setup instructions, see the [root README](../../README.md).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [GraphQL Integration](#graphql-integration)
- [Authentication](#authentication)
- [Internationalization](#internationalization)
- [Design System](#design-system)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)

---

## Tech Stack

| Technology                                  | Version |
| ------------------------------------------- | ------- |
| Next.js (App Router, standalone output)     | 16.x    |
| React                                       | 19.x    |
| Apollo Client (SSR + CSR)                   | 4.x     |
| shadcn/ui · Radix UI                        | —       |
| Tailwind CSS v4 · CSS Variables             | 4.x     |
| next-intl (EN/FR)                           | 4.x     |
| next-themes (dark mode)                     | —       |
| Recharts                                    | 2.x     |
| Motion (animations)                         | 12.x    |
| GraphQL Code Generator                      | 6.x     |
| Vitest · Testing Library · Playwright · MSW | —       |

---

## Project Structure

```
app/
├── api/health/               # Health check endpoint
└── [locale]/
    ├── (public)/             # Unauthenticated routes: landing page, login, auth error
    ├── (onboarding)/         # Sport selection wizard, sync progress, completion
    └── (dashboard)/          # Protected routes (require auth)
        ├── dashboard/        # Global stats dashboard
        ├── activities/       # Activity list + detail ([id])
        ├── sports/           # Per-sport dashboards (running, cycling, swimming)
        ├── goals/            # Goal list, creation ([new]), editing ([id]/edit)
        ├── badges/           # Badge gallery (v2)
        └── settings/         # User preferences and account

components/
├── ui/                       # shadcn/ui components (Button, Card, Dialog, Input…)
├── providers/                # React context providers (Theme, Apollo)
├── layout/                   # Sidebar, Header, mobile navigation
├── activities/               # ActivityCard, ActivityList, filters
├── dashboard/                # StatCard, charts, GoalsSection
├── goals/                    # GoalCard, GoalForm, progress charts
├── sport-dashboard/          # Per-sport dashboard views
├── onboarding/               # Sport selection, sync wizard
├── auth/                     # LoginCard, AuthErrorBoundary
├── landing/                  # Hero, Features, HowItWorks sections
├── badges/                   # Badge gallery
└── settings/                 # Settings forms and panels

lib/
├── apollo-client.ts          # Server-side Apollo Client (SSR)
├── apollo-wrapper.tsx        # Client-side ApolloProvider with refresh link
├── apollo-refresh-link.ts    # Custom Apollo Link for transparent token refresh
├── graphql.ts                # Re-exports from gql/ (generated helpers)
├── auth/
│   ├── context.tsx           # Auth React context + useAuth() hook
│   ├── provider.tsx          # Server component: auth check + redirect
│   ├── dal.ts                # Data access layer (cookie inspection)
│   ├── fetch-user.ts         # currentUser query with exponential backoff
│   └── use-logout.ts         # Logout hook (revoke token + clear cache)
├── activities/               # Activity formatting utilities
├── dashboard/                # Dashboard data helpers
├── goals/                    # Goal utilities and formatters
└── utils.ts                  # cn() and general helpers

graphql/
├── fragments/                # Reusable GraphQL fragments
├── queries/                  # .graphql query files (activities, auth, goals…)
└── mutations/                # .graphql mutation files

gql/                          # Auto-generated TypeScript types (gitignored)

i18n/
├── routing.ts                # Locale routing config (en, fr)
├── request.ts                # Server-side next-intl config
└── navigation.ts             # Type-safe Link, useRouter, usePathname

messages/
├── en.json                   # English translations
└── fr.json                   # French translations

mocks/
├── handlers.ts               # MSW GraphQL mock handlers
├── fixtures/                 # Mock data (users, activities, goals…)
└── server.ts                 # MSW server setup

__tests__/                    # Playwright E2E tests
├── setup/                    # Global setup, teardown, DB helpers
├── fixtures/                 # Auth fixtures
└── helpers/                  # Cookie and session helpers

test-utils/                   # Shared testing utilities (render helpers, wrappers)

public/                       # Static assets (SVG topographic patterns, icons)
```

---

## Architecture

### SSR vs CSR

The frontend uses both server-side and client-side rendering:

- **Server Components** call `getClient()` from `lib/apollo-client.ts` for SSR GraphQL queries (no JavaScript bundle cost).
- **Client Components** use Apollo hooks (`useSuspenseQuery`, `useMutation`) via the `ApolloWrapper` provider.

The root `[locale]/layout.tsx` wraps all routes with providers in this order:
`ApolloWrapper` → `NextIntlClientProvider` → `ThemeProvider` → `Toaster`

### Apollo Link Chain (Browser)

```
Request → RefreshLink → HttpLink → GraphQL API
              ↑
     Intercepts UNAUTHENTICATED errors,
     calls RefreshToken mutation,
     batches pending requests,
     retries on success or redirects to /login on failure
```

`lib/apollo-refresh-link.ts` handles transparent token rotation. Concurrent requests during a refresh are batched and replayed automatically.

### Cache Strategy

Apollo `InMemoryCache` uses field policies for merging paginated/list data:

- `activities`, `goals`, `activeGoals`, `goalTemplates` — custom merge functions for deduplication and cursor-based pagination.

---

## GraphQL Integration

For the client architecture (Apollo Link chain, SSR vs CSR setup, cache policies), see the [Architecture](#architecture) section above.

### Code Generation

Frontend TypeScript types are generated from the backend schema (`apps/api/src/schema.gql`):

```bash
pnpm codegen          # Generate types once
pnpm codegen:watch    # Watch mode for development
```

The `gql/` directory is gitignored — **run codegen before building**. For Docker builds, run it locally before `docker build` (see root README).

### Server Components (SSR)

```typescript
import { getClient } from '@/lib/apollo-client';
import { MyQueryDocument } from '@/gql/graphql';

export default async function Page() {
  const { data } = await getClient().query({ query: MyQueryDocument });
  return <div>{data.field}</div>;
}
```

### Client Components (CSR)

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

Fragments are masked by default for better encapsulation. Unmask with `getFragmentData()`:

```typescript
import { getFragmentData } from '@/lib/graphql';
import { UserFullInfoFragmentDoc } from '@/gql/graphql';

const userFragment = getFragmentData(UserFullInfoFragmentDoc, data.currentUser);
```

---

## Authentication

JWT-based authentication via httpOnly cookies managed by the backend. The frontend never handles raw tokens.

```
User clicks "Login with Strava"
  → Query stravaAuthUrl from GraphQL API
  → Redirect to Strava OAuth consent page

Strava callback
  → Backend exchanges code, sets httpOnly cookies (access_token, refresh_token)
  → Redirect to /[locale]/dashboard (onboarding completed) or /[locale]/onboarding (first login)

Dashboard load
  → AuthProvider (server component) queries currentUser
  → Redirects to /login if no valid session
  → Passes user to DashboardClientLayout for client-side context

Token expiry (transparent)
  → Apollo RefreshLink intercepts UNAUTHENTICATED error
  → Calls /v1/auth/refresh via RefreshToken mutation
  → Backend rotates tokens, sets new cookies
  → Original request is retried automatically

Session expiry (unrecoverable)
  → Redirect to /login?reason=session_expired
```

**Using the auth context in client components:**

```typescript
import { useAuth } from '@/lib/auth/context';

export function UserProfile() {
  const { user } = useAuth();
  return <span>{user.username}</span>;
}
```

**Protecting server routes** — wrap with `AuthProvider`:

```typescript
// app/[locale]/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      {(user) => <DashboardClientLayout user={user}>{children}</DashboardClientLayout>}
    </AuthProvider>
  );
}
```

---

## Internationalization

Supported locales: `en` (English) and `fr` (French).

Route structure:

- `/en/dashboard` → English
- `/fr/dashboard` → French

Always use locale-aware helpers from `@/i18n/navigation` instead of Next.js defaults:

```typescript
import { Link, useRouter, usePathname } from '@/i18n/navigation';

<Link href="/dashboard">Dashboard</Link>
```

Translations live in `messages/en.json` and `messages/fr.json`. Use `useTranslations()` in both server and client components:

```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('Dashboard');
  return <h1>{t('title')}</h1>;
}
```

---

## Design System

Built on **shadcn/ui** (New York style, neutral base) with **Tailwind CSS v4** and CSS custom properties. All components follow a consistent visual language.

### Primary Color

`--primary: oklch(0.6216 0.198 32.23)` — warm orange-red, defined in `app/globals.css`.

| Usage pattern                        | Use case                                     |
| ------------------------------------ | -------------------------------------------- |
| `bg-primary`                         | Primary CTAs (buttons, badges)               |
| `bg-primary/10 text-primary`         | Active navigation items, progress bar tracks |
| `hover:bg-primary/90`                | Button hover states                          |
| `ring-2 ring-primary border-primary` | Selected states (cards, options)             |
| `hover:border-primary/50`            | Interactive card hover effects               |
| `text-primary`                       | Icons in active states, highlight text       |

### Topographic Patterns

Subtle SVG topographic patterns reinforce the outdoor/athletic brand identity:

| Class                     | Use case                                 |
| ------------------------- | ---------------------------------------- |
| `.bg-pattern-topo-subtle` | Page backgrounds, hero sections, headers |
| `.bg-pattern-topo-bottom` | Sidebar navigation, section containers   |

Apply patterns only to large containers — never on small components (cards, buttons, badges).

### Dark Mode

Dark mode is supported via Tailwind `dark:` variants and switched via `next-themes`. The primary color value is consistent across both modes.

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component]
```

---

## Environment Variables

See `.env.example` for the full list.

| Variable                       | Description                             | Example                               | Required |
| ------------------------------ | --------------------------------------- | ------------------------------------- | -------- |
| `NEXT_PUBLIC_GRAPHQL_URL`      | GraphQL API endpoint (browser)          | `http://localhost:3011/graphql`       | ✅       |
| `NEXT_PUBLIC_APP_URL`          | App base URL (OG tags, canonical)       | `https://strivpath.com`               | ✅       |
| `NEXT_PUBLIC_LEGAL_BASE_URL`   | Domain for legal pages (privacy, terms) | `https://legal.strivpath.com`         | ❌       |
| `GRAPHQL_URL_INTERNAL`         | Docker-internal API URL (SSR only)      | `http://api:3011/graphql`             | ❌       |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Umami analytics script URL              | `https://umami.example.com/script.js` | ❌       |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami website ID                        | `abc-123`                             | ❌       |
| `NEXT_PUBLIC_UMAMI_DOMAINS`    | Restrict tracking to specific domains   | `strivpath.com,www.strivpath.com`     | ❌       |

`GRAPHQL_URL_INTERNAL` is used server-side in Docker when the frontend container communicates with the API container on an internal network. Falls back to `NEXT_PUBLIC_GRAPHQL_URL` if not set.

---

## Development

**Prerequisites**: API running at `http://localhost:3011` · `.env.local` from `.env.example` · GraphQL types generated

```bash
# Generate GraphQL types (required before first run)
pnpm codegen

# Start dev server (port 3000)
pnpm dev

# Start dev server + codegen watcher concurrently
pnpm dev:full

# Lint
pnpm lint
```

Frontend: `http://localhost:3000`

**Docker builds**: use `pnpm build:docker` (skips codegen — `gql/` must already exist). Run `pnpm codegen` locally before `docker build`. See the [root README](../../README.md#getting-started) for the full Docker workflow.

---

## Testing

```bash
pnpm test             # Unit and component tests (Vitest)
pnpm test:watch       # Watch mode
pnpm test:cov         # With coverage report
pnpm test:ui          # Vitest UI (browser interface)

pnpm test:e2e         # Playwright E2E tests (requires API + DB running)
pnpm test:e2e:ui      # Playwright UI mode
```

### Unit and Component Tests

Tests are co-located with source files (e.g. `component.test.tsx` next to `component.tsx`). All GraphQL requests are intercepted by **MSW** (Mock Service Worker) — no real API calls in unit tests.

Define or override mock handlers in `mocks/handlers.ts`:

```typescript
import { graphql, HttpResponse } from 'msw';

export const handlers = [
  graphql.query('CurrentUser', () => HttpResponse.json({ data: { currentUser: { id: 1, username: 'test' } } })),
];
```

MSW starts automatically before each test suite via `vitest.setup.ts`.

### E2E Tests

Playwright tests in `__tests__/` run against a real API and database. A dedicated test database is recommended. The global setup initializes the database and creates auth fixtures before the suite runs.
