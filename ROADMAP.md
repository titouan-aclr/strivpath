# StrivPath — Roadmap

This document outlines the release track and planned features beyond the initial v1.0.

---

## v1.0 — Initial Release

- Strava OAuth 2.0 with secure JWT authentication (httpOnly cookies, token rotation)
- Bulk activity import with real-time progress tracking (polling-based)
- Incremental sync via Strava webhooks
- Global and per-sport statistics dashboard (running, cycling, swimming)
- Activity detail view with full Strava metrics
- Goal system with custom goals, predefined templates, and recurring goal data model
- Onboarding wizard (sport selection, guided initial sync)
- Internationalization: English and French (next-intl, locale-aware routing)
- Light / Dark / System theme
- CI/CD with GitHub Actions, Docker, Dokploy + Traefik

---

## v1.1 — Security & Reliability

Quality and security improvements that should land shortly after v1.0.

- [ ] Strava token encryption at rest (AES-256-GCM) — tokens currently stored in plaintext
- [ ] Consistent structured logging throughout the API (correlation IDs, log levels, JSON output)
- [ ] Replace `console.error` in frontend error boundaries with a proper logging abstraction
- [ ] Fix `logOnboardingError` — currently a no-op stub, frontend errors are silently dropped in production
- [ ] Recurring goals auto-renewal service — background job to spawn the next period instance when the current one ends
- [ ] Remove `syncStatus` query (duplicate of `latestSyncHistory`) and consolidate into `SyncHistoryResolver`
- [ ] Move Strava OAuth URL construction out of resolver into `AuthService`

---

## v1.2 — Demo Mode

The app currently requires a Strava account to access any feature beyond the landing page. Anyone without a Strava account — or unwilling to connect a personal account — sees nothing beyond the login screen and README screenshots, which prevents a meaningful first impression of the product.

- [ ] Seed database with a demo athlete (realistic multi-sport activity history spanning 18+ months)
- [ ] Demo activities covering running, cycling, and swimming with varied metrics (distance, pace, elevation, heart rate)
- [ ] Demo goals in different states: one near completion, one recurring in progress, one recently completed
- [ ] One-click demo access from the landing page — no Strava OAuth required
- [ ] Read-only demo session: no real Strava API calls, no data mutations persisted beyond the session
- [ ] Persistent demo banner visible throughout the app
- [ ] Scheduled auto-reset of demo data (or per-session ephemeral demo account)

---

## v1.3 — Test Coverage

The unit test suite is comprehensive. This version closes the remaining gaps in integration and E2E coverage.

- [ ] Integration tests: `StatisticsService` against a real database (sportPeriodStatistics, personalRecords, activityCalendar)
- [ ] Integration tests: Strava webhook endpoint (full HTTP flow including signature verification)
- [ ] E2E backend: `syncActivities` mutation, activity queries, statistics queries
- [ ] E2E frontend (Playwright): dashboard flows, goal creation / editing / deletion, onboarding, sport dashboards
- [ ] CI: enforce minimum coverage thresholds via Codecov and fail the pipeline on regressions

---

## v2.0 — Goals & Achievements

### Goal Detail Redesign

The current goal detail page shows a static progress bar and metadata. It lacks the depth needed to understand trajectory.

- [ ] Progression chart: cumulative progress plotted over time within the goal period
- [ ] Historical comparison for recurring goals (current period vs. previous periods side by side)
- [ ] Contextual insight line ("3 more activities needed to reach your goal before the deadline")
- [ ] Visual milestone markers at 25%, 50%, 75%, 100%

### Onboarding First Goal

The current onboarding flow ends after the initial sync, missing an opportunity to immediately anchor the user to the app's core value proposition.

- [ ] Add a goal-creation step at the end of the onboarding wizard
- [ ] Pre-suggest a relevant goal based on selected sport and recent activity history
- [ ] Clear skip option (no forced commitment)

### Badges & Achievements

The badges page currently shows a "Coming Soon" placeholder. No backend implementation exists.

- [ ] Prisma models: `Badge`, `UserBadge`, `BadgeCategory`
- [ ] Badge evaluation engine in the API (rule-based, runs after each sync)
- [ ] Badge categories: distance milestones, consistency streaks, speed records, elevation
- [ ] Rarity system (common / uncommon / rare / legendary)
- [ ] Badges page: earned gallery + progress toward locked badges
- [ ] Badge unlock notifications surfaced after a sync

---

## v3.0 — Advanced Analytics & Maps

### Advanced Analytics

- [ ] Personal records tracking (fastest 5K, longest ride, best elevation gain, etc.) with automatic detection on sync
- [ ] Lap and split breakdown on the activity detail page
- [ ] Pace zone and heart rate zone analysis per activity
- [ ] Period-over-period comparison on sport dashboards (this month vs. last month)
- [ ] Similar activity comparison (same sport, comparable distance or route)

### Maps

- [ ] Interactive route map on the activity detail page (Leaflet or MapLibre GL JS)
- [ ] Elevation profile chart synchronized with map position
- [ ] Cumulative activity heatmap across all activities on a global map

---

## v4.0 — Performance & Infrastructure

### Frontend Performance

- [ ] Lighthouse score improvements for the landing page (current baseline: ~71 local / ~78 production)
- [ ] Image optimization audit: WebP conversion, lazy loading, complete `next/image` coverage
- [ ] Core Web Vitals monitoring (LCP, CLS, INP) via self-hosted or Vercel Analytics

### Backend Infrastructure

- [ ] GraphQL Subscriptions (WebSocket) to replace polling for activity sync progress
- [ ] BullMQ + Redis for background job queues (sync, statistics, badge evaluation)
- [ ] Redis caching for pre-computed statistics to reduce database load on dashboard queries
- [ ] Composite database index `(userId, type, startDate)` on `Activity` for sport dashboard query performance

### Additional Sports

- [ ] Extend beyond running, cycling, and swimming: triathlon, skiing, yoga, climbing
- [ ] Sport-agnostic metric configuration (extensible via config, not code changes)

---

## v5.0 — Social & Mobile

- [ ] Push notifications: goal deadline reminders, inactivity nudges, badge unlocks (browser)
- [ ] Email reminders (opt-in): weekly goal summaries, milestone celebrations
- [ ] Goal and achievement sharing (shareable link or image export)
- [ ] Friend leaderboards via the Strava social graph
- [ ] React Native companion app or PWA with offline support

---

## Notes

Features within each version are listed roughly in priority order. Version boundaries are thematic, not time-based — scope and ordering may shift based on feedback and real-world usage.
