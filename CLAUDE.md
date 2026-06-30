# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Waymate is a carpooling app (student project) organized as a Bun workspace monorepo with Turborepo. Apps and packages share a single `bun.lock` and are orchestrated via `turbo.json`.

## Commands

All commands run from the repository root unless otherwise noted.

```bash
bun install          # install all workspace dependencies
bun run dev          # start all apps in watch mode (Turbo)
bun run build        # build all apps
bun run typecheck    # TypeScript check across the monorepo
bun run lint         # ESLint across the monorepo
bun run lint:fix     # auto-fix ESLint issues
bun run format       # Prettier format
bun run format:check # Prettier check (used in CI)

bun run --cwd apps/web i18n:check   # flag unused keys + en/cs/sk drift
```

Database (run from the repo root, scoped to `apps/api`):

```bash
bun run --cwd apps/api db:generate   # diff schema vs last snapshot, write SQL into apps/api/drizzle/
bun run --cwd apps/api db:migrate    # apply pending migrations to the local DB
bun run --cwd apps/api db:push       # local-only: push the schema diff without writing migration files
bun run --cwd apps/api db:studio     # browse the local DB in Drizzle Studio
bun run --cwd apps/api seed:cities   # populate the `cities` reference table from GeoNames (SK + CZ); TRUNCATE…CASCADE + INSERT, so it also wipes rides/ride_stops/prices/bookings — follow with `seed`. Caches dumps in apps/api/.geonames-cache/
bun run --cwd apps/api seed          # populate dev fixtures (admin, drivers, cars, rides, bookings). Must run AFTER seed:cities — ride stops look up city_id by name and abort if cities are missing.
```

Fresh-DB sequence: `db:migrate` → `seed:cities` → `seed`. Order matters now that `ride_stops.city_id` references `cities(id)`.

Schema changes go through `db:generate` and the resulting SQL in `apps/api/drizzle/` is committed alongside the schema diff — that's the audit trail and the only path that ships to shared environments. `db:push` exists for fast local iteration before a change is PR-ready, but never use it on a database anyone else relies on.

Start the local infrastructure — PostgreSQL and Redis (the rate limiter's backing store) via Docker:

```bash
docker compose up -d
```

The API requires a `.env` file in `apps/api/` — copy from `.env.example`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/spolujazda_db
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
# REDIS_URL is optional — defaults to redis://localhost:6379 (the docker-compose service)
```

The API runs on port **3000** in dev mode. OpenAPI docs are served at `/openapi` (Scalar UI) and `/openapi/json` (raw spec) via `@elysiajs/openapi`.

Generate the committed spec file used by the web client codegen with:

```bash
bun run --cwd apps/api openapi:dump   # writes apps/api/openapi.json
bun run --cwd apps/web codegen        # regenerates apps/web/src/api-client
```

## Architecture

### Monorepo layout

```
apps/api/     — Elysia backend (Bun runtime, port 3000)
apps/web/     — React 19 + Vite + Tailwind CSS 4 frontend
packages/db/  — stub package (DB schema lives in apps/api)
packages/shared/ — stub package (shared types not yet extracted)
```

### API module structure (`apps/api/src/modules/<name>/`)

Every domain module follows the same layered pattern:

| File              | Responsibility                                                                         |
| ----------------- | -------------------------------------------------------------------------------------- |
| `*.routes.ts`     | HTTP route definitions and request validation                                          |
| `*.service.ts`    | Business logic, orchestration, and **transactions** (`db.transaction`). Imports `db`.  |
| `*.repository.ts` | Pure Drizzle queries. Each function takes an `Executor` (`db \| tx`) as its first arg. |
| `*.types.ts`      | TypeScript types (DB row inferences, service/repository contracts, view models)        |
| `*.errors.ts`     | The module's `DomainError` subclass, its error-code constants, and the code→HTTP-status map that sets each error's `httpStatus` |

Zod request/response schemas live in `packages/shared/src/*.schema.ts` — not co-located with modules — so the same schema definitions can be reused by the web client. They are registered in `z.globalRegistry` (see `packages/shared/src/register.ts`) so cross-schema references render as `$ref`s in the OpenAPI spec.

Current modules: `auth`, `users`, `cars`, `rides`, `bookings`, `reviews`, `reports`, `blocks`, `chat`, `statistics`, `health`.

**Layering rules:**

- Repository functions are pure data access. They take `executor: Executor` first (where `Executor = Database | Tx`, both exported from `apps/api/src/db/index.ts`) and contain no `db.transaction()` calls, no business validation, and no error mapping. They return rows or simple DTOs.
- Services are the only layer that imports `db` directly and the only layer that calls `db.transaction(async (tx) => …)`. Inside a transaction, services call repository functions with `tx`; outside, they pass `db`. Services own all branching, status-history writes, business validation (e.g. self-booking, capacity, rating-window), and translation of low-level errors (e.g. Postgres unique-violation) into domain errors.
- Services throw typed `DomainError` subclasses; each error carries its own `httpStatus` (set from a per-module code→status `Record`). A single root `.onError` maps any `DomainError` with `status(error.httpStatus, { error: error.code })` — modules do not define their own `.onError`.

**REST conventions:**

- Collections are plural nouns (`/rides`, `/bookings`, `/cars`, …). Creation is `POST /<collection>` returning `201`.
- **State-machine transitions are `PATCH /<collection>/:id/<action>`** — e.g. `PATCH /rides/:id/{cancel,end,complete}`, `PATCH /bookings/:id/{cancel,confirm,reject}`, `PATCH /cars/:id/status`. They mutate a resource's status (with a status-history write) rather than creating anything, and re-issuing the same transition is a no-op / domain error, so PATCH (not POST) is the deliberate, uniform choice. New transitions must follow this pattern — do not introduce `POST /:id/<action>` for a transition.
- `POST` on a non-collection path is reserved for **complex-body reads** that don't fit in query params and don't mutate state — currently only `POST /rides/estimate-eta` (an OSRM ETA computation). Keep these rare and clearly read-only.

The Elysia app is exported as `app` from `apps/api/src/index.ts`. The web client consumes the API through generated TypeScript hooks; the OpenAPI spec is rendered from Zod schemas via `@elysiajs/openapi`. The `Auth` type is also exported for better-auth client usage.

### Authentication and authorization

Auth is handled by **better-auth** (`apps/api/src/modules/auth/auth.ts`) with a Drizzle adapter targeting PostgreSQL. It supports email/password and Google OAuth.

Three Elysia macros guard routes:

- `isAuthenticated` — requires a valid session; injects `user` and `session` into context
- `isFullyOnboarded` — additionally requires `user.firstName`, `user.lastName`, and `user.phone` to be set; returns `403 ONBOARDING_REQUIRED` otherwise
- `requireAdmin` — composes `isAuthenticated` (not `isFullyOnboarded`) and additionally requires `user.role === "ADMIN"`; returns `403 FORBIDDEN` otherwise

When a guard fails, the macro **throws** `AuthError` (`apps/api/src/modules/auth/auth.errors.ts`) — never `return status(...)` inline. `AuthError` is a `DomainError` like any module error: it carries an `httpStatus` (401/403) and is caught by the single root `.onError`, which maps every `DomainError` the same way (`status(error.httpStatus, { error: error.code })`). The rule: macros and services throw typed domain errors; only the root `.onError` translates them to HTTP responses.

Most routes (Cars, Rides) require `isFullyOnboarded`. User profile routes use `isAuthenticated`.

The `users.userRole` column (`USER` / `ADMIN`, default `USER`) drives `requireAdmin`. The role is not user-settable through any API surface — neither auth (`input: false` in better-auth `additionalFields`) nor admin tooling (the admin user-management endpoints filter out admin rows entirely; see `AdminRepository.visibleUserConditions`). The dev admin lives in `db/seed.ts` (`admin@example.com` / `admin1234`); promoting another user is a manual `UPDATE users SET user_role = 'ADMIN' WHERE email = '...'` against the database.

### Request hardening

Two cross-cutting checks fire in the root `.onRequest` hook (`apps/api/src/index.ts`) before any route handler runs:

- **Body size limit** — rejects requests whose `Content-Length` exceeds `MAX_REQUEST_BODY_BYTES` (default 100 KiB) with HTTP `413 PAYLOAD_TOO_LARGE`. `GET`/`HEAD`/`OPTIONS` and chunked-without-Content-Length requests are skipped.
- **Rate limiting** — global default of 60 req / 60s per client IP, plus stricter per-route caps (e.g. `POST /rides` 10/min, `POST /bookings` 20/min, `PATCH /admin/users/:id/status` 30/min). Both checks run on a matching request, so route-specific caps stack with the global one. Returns `429 RATE_LIMITED` with a `Retry-After` header. `/health`, `/api/auth/*`, and `/openapi*` are excluded — better-auth has its own per-endpoint rate-limit config (`apps/api/src/modules/auth/auth.ts`) for the auth flow.

Both throw `RequestError` (`apps/api/src/shared/request-errors.ts`) and are caught by the root `.onError`. Rate limiting is a **Redis-backed token bucket** (`apps/api/src/shared/rate-limit.ts`): an atomic Lua script (`consumeToken`) refills and decrements a per-IP bucket in Redis (`REDIS_URL`), so the limit is shared and exact across all replicas. If Redis is unreachable the check **fails open** (logs and allows the request) rather than taking down the API. better-auth keeps its own DB-backed rate limiting for `/api/auth/*`. Client IP is read from `x-forwarded-for` at the position set by `TRUSTED_PROXY_COUNT` (default 1 — the last hop), counted from the end so a client cannot escape its bucket by prefilling the header. Production must run behind exactly that many trusted reverse proxies.

Limits are constants in `apps/api/src/index.ts` for now — tuning them requires a redeploy. Promote to env vars when ops need to tweak without code changes.

### Logging

Structured logging uses **pino** (`apps/api/src/shared/logger.ts`). The single `logger` instance is JSON in production and pretty-printed (via `pino-pretty`) when `NODE_ENV=development`. Level is set by `LOG_LEVEL` (default `info`). Authorization / Cookie / Set-Cookie headers and `*.password` / `*.token` fields are redacted before serialization — never disable that.

Request lifecycle logging lives in the root app (`apps/api/src/index.ts`):

- The root `.onRequest` mints a `requestId` (UUID), stashes it with a start time in a per-request `WeakMap` (`apps/api/src/shared/request-meta.ts`), and echoes it back as the `x-request-id` response header.
- The root `.onAfterResponse` emits one `request` log line per request: `{ requestId, method, path, status, durationMs }`. It reads the final HTTP status from `set.status`, which Elysia populates reliably for routed responses (success, in-handler `status(...)`, and `.onError` mappings). Genuinely unmatched paths swallowed by the mounted better-auth handler are the one exception — they log `200` even though the client gets `404`.
- 500-class errors are logged with the full error (stack) and `requestId` in the root `.onError` catch-all, where any error that is not a `DomainError` / validation / parse / not-found becomes `INTERNAL_SERVER_ERROR`. Expected domain / auth / validation errors (4xx) are NOT logged as errors — they only appear in the `request` line.

CLI scripts (`db/seed.ts`, `db/seed-cities.ts`) and the env-validation failure path (`config/env.ts`) intentionally stay on `console.*` — they run before/outside the request logger.

### Database schema (`apps/api/src/db/schema/`)

Schema is defined with Drizzle ORM in `apps/api`, not in `packages/db`. Key design decisions:

- All PostgreSQL enums are defined in `enums.ts` and imported by table files.
- Enum values (string arrays) live in `apps/api/src/shared/status-values.ts` and are shared with Zod schemas.
- **Timestamps** use `timestamp(6) with time zone` across every domain table (helper: `timestamptz(name)` in `db/schema/timestamps.ts`). Don't use bare `timestamp(...)` — it produces a naive `timestamp` and breaks ordering across writers in different locales.
- **`updatedAt` is auto-bumped by a trigger** (`set_updated_at_to_now`, defined in `drizzle/0003_*.sql` and attached to every table that has an `updated_at` column). Service / repository code must NOT pass `updatedAt: new Date()` in `.set(...)` — the value will be silently overwritten by the trigger anyway, and the explicit assignment misleads readers about the source of truth. The column still has `defaultNow().notNull()` for INSERT.
- **Soft deletes** via `deletedAt` timestamp column — filtered with `isNull(table.deletedAt)` in queries. Uniqueness-sensitive columns (`users.email`, `cars.spz`+`country_code`, `(rides.id, reviews.author_id, subject_id)`) use **partial unique indexes scoped to `WHERE deleted_at IS NULL`** so a soft-deleted row never permanently reserves a key.
- **Status history tables** (`ride_status_history`, `booking_status_history`, `user_status_history`) provide a full audit trail of every status transition; always insert a history record when updating status.
- **Ride stops** use a 0-indexed `stopOrder` integer. Stop 0 is the origin; the last stop is the destination. Prices are per-segment (a `prices` row references `startStopId` → `endStopId`), not a flat per-ride price. When creating a ride, the client sends stop orders; the service translates them to UUIDs inside a `db.transaction()`.
- All ride/booking creation that spans multiple tables is wrapped in a `db.transaction()` — and that wrapper lives in the service layer, never in a repository (see "Layering rules" above).
- UUID primary keys generated via `defaultRandom()` (PostgreSQL `gen_random_uuid()`).

### Zod usage

The project uses **Zod v4**. Use `z.uuid()`, `z.url()`, `z.email()` directly (not `z.string().uuid()` etc.). Input schemas use `z.coerce.date()` for date fields coming from HTTP query/body.

### Frontend (`apps/web/`)

- React 19 + Vite. UI scaffolding only; pages are placeholders being wired to real data feature by feature.
- Uses **`@waymate/ui`** (external component library from a separate GitLab repo `waymate-ui`). Must be cloned, built, and linked locally with `bun link` as described in the README.
- i18n via **react-i18next** with three locales: `en`, `cs`, `sk` (files in `apps/web/src/i18n/locales/`).

#### Data layer

- **Orval-generated client** — TanStack Query hooks generated from the OpenAPI spec into `apps/web/src/api-client/`. Re-run with `bun run --cwd apps/web codegen` after API changes (the spec must be re-dumped first via `bun run --cwd apps/api openapi:dump`). Generated code is git-ignored at the lint level (`apps/web/eslint.config.js` excludes `src/api-client/**`).
- **Custom fetcher**: `apps/web/src/lib/api-fetcher.ts` injects `credentials: "include"` and throws `ApiError` on non-2xx responses. Configured as the Orval mutator in `apps/web/orval.config.ts`.
- **TanStack Query** — `QueryClient` is created in `apps/web/src/lib/query-client.ts` and provided from `main.tsx`. Compose generated hooks (`useGetX`, `usePostX`, …) directly; `apps/web/src/hooks/` contains thin wrappers that add invalidation logic on top.
- **Do not use `fetch` directly.** OpenAPI-surface routes go through Orval-generated hooks; better-auth-backed flows (sign-in, sign-up, password reset, …) go through `authClient` in `apps/web/src/lib/auth-client.ts`.

Example:

```ts
import { useGetCarsBrands } from "@/api-client/cars/cars";

const { data } = useGetCarsBrands();
```

#### Routing

- **TanStack Router — file-based routing.** Routes live in `apps/web/src/routes/` and the route tree is generated into `apps/web/src/routeTree.gen.ts` by the `@tanstack/router-plugin/vite` plugin (`vite.config.ts`, `autoCodeSplitting: true` — each route is its own lazy chunk). Don't edit `routeTree.gen.ts` by hand; add/rename files under `routes/` and the plugin regenerates it. Folder conventions: `route.tsx` is a layout/pathless wrapper, `index.tsx` is the page at that path, and `-`-prefixed folders (`-components/`, `-hooks/`, `-lib/`, `-schema.ts`) are co-located, route-private modules that the plugin excludes from the route tree.
- The router instance is built in `apps/web/src/router.tsx` via `createAppRouter(queryClient)`, which wires the generated `routeTree`, injects `{ queryClient }` as router context, and sets `RouteErrorBoundary` as the `defaultErrorComponent`. The root route (`routes/__root.tsx`) wraps everything in `LayoutProvider` + a session-wide `ChatSocketConnection` + a `Suspense` boundary for the code-split chunks. Route guards compose through `RouterContext` (`apps/web/src/lib/route-guards.ts`); typed `history.state` lives in `apps/web/src/lib/router-state.ts`.
- **`react-router-dom` is NOT installed** and there is no compat shim — use TanStack Router APIs directly (`useNavigate`/`Link` from `@tanstack/react-router`, typed search params via `Route.useSearch()`).
- **Layout state** (`language`, `theme`) lives in `LayoutProvider` (`apps/web/src/lib/layout-context.tsx`). Components access it via `useLayout()` (`apps/web/src/lib/use-layout.ts`). Do not lift this state back to `App.tsx`.

### CI (GitLab)

`.gitlab-ci.yml` runs every job in a single `verify` stage — all in parallel — on every MR and push, and all must pass before merge:

- `lint` — ESLint across the monorepo
- `format` — Prettier check
- `typecheck` — TypeScript check across the monorepo
- `i18n-check` — flags unused keys and en/cs/sk drift in `apps/web`
- `test` — the Vitest API suite (`apps/api`), run against a throwaway PostgreSQL service container
- `build` — Turbo build of all apps
- `migration-drift` — re-runs `db:generate` and fails if `apps/api/drizzle/` is out of sync with the schema
- `generate-lockfile` — publishes `bun.lock` as a pipeline artifact

The `test` job provisions a `postgres:18` service and overrides `DATABASE_URL` to point at it; the API's vitest `globalSetup` then migrates that database. The Playwright e2e suite (`e2e/`) is **not** part of CI.
