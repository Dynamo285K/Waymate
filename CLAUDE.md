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
```

Database (run from the repo root, scoped to `apps/api`):

```bash
bun run --cwd apps/api db:generate   # diff schema vs last snapshot, write SQL into apps/api/drizzle/
bun run --cwd apps/api db:migrate    # apply pending migrations to the local DB
bun run --cwd apps/api db:push       # local-only: push the schema diff without writing migration files
bun run --cwd apps/api db:studio     # browse the local DB in Drizzle Studio
```

Schema changes go through `db:generate` and the resulting SQL in `apps/api/drizzle/` is committed alongside the schema diff — that's the audit trail and the only path that ships to shared environments. `db:push` exists for fast local iteration before a change is PR-ready, but never use it on a database anyone else relies on.

Start the local database (PostgreSQL via Docker):

```bash
docker compose up -d
```

The API requires a `.env` file in `apps/api/` — copy from `.env.example`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/spolujazda_db
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
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
| `*.routes.ts`     | HTTP route definitions, request validation, error-to-status mapping                    |
| `*.service.ts`    | Business logic, orchestration, and **transactions** (`db.transaction`). Imports `db`.  |
| `*.repository.ts` | Pure Drizzle queries. Each function takes an `Executor` (`db \| tx`) as its first arg. |
| `*.types.ts`      | TypeScript types (DB row inferences, service/repository contracts, view models)        |
| `*.errors.ts`     | Plain string error constants thrown by the service                                     |

Zod request/response schemas live in `packages/shared/src/*.schema.ts` — not co-located with modules — so the same schema definitions can be reused by the web client. They are registered in `z.globalRegistry` (see `packages/shared/src/register.ts`) so cross-schema references render as `$ref`s in the OpenAPI spec.

Current modules: `auth`, `users`, `cars`, `rides`, `bookings`, `reviews`, `health`.

**Layering rules:**

- Repository functions are pure data access. They take `executor: Executor` first (where `Executor = Database | Tx`, both exported from `apps/api/src/db/index.ts`) and contain no `db.transaction()` calls, no business validation, and no error mapping. They return rows or simple DTOs.
- Services are the only layer that imports `db` directly and the only layer that calls `db.transaction(async (tx) => …)`. Inside a transaction, services call repository functions with `tx`; outside, they pass `db`. Services own all branching, status-history writes, business validation (e.g. self-booking, capacity, rating-window), and translation of low-level errors (e.g. Postgres unique-violation) into domain errors.
- Routes catch domain errors thrown by services and map them to HTTP status codes.

The Elysia app is exported as `app` from `apps/api/src/index.ts`. The web client consumes the API through generated TypeScript hooks; the OpenAPI spec is rendered from Zod schemas via `@elysiajs/openapi`. The `Auth` type is also exported for better-auth client usage.

### Authentication and authorization

Auth is handled by **better-auth** (`apps/api/src/modules/auth/auth.ts`) with a Drizzle adapter targeting PostgreSQL. It supports email/password and Google OAuth.

Three Elysia macros guard routes:

- `isAuthenticated` — requires a valid session; injects `user` and `session` into context
- `isFullyOnboarded` — additionally requires `user.firstName`, `user.lastName`, and `user.phone` to be set; returns `403 ONBOARDING_REQUIRED` otherwise
- `requireAdmin` — composes `isAuthenticated` (not `isFullyOnboarded`) and additionally requires `user.role === "ADMIN"`; returns `403 FORBIDDEN` otherwise

When a guard fails, the macro **throws** `AuthError` (`apps/api/src/modules/auth/auth.errors.ts`) — never `return status(...)` inline. Each module's `.onError` then catches it via `instanceof AuthError` and maps it through `authErrorToHttpStatus`, the same shape used for module-specific domain errors (`AdminError`, `RideError`, …). The rule: macros and services throw typed domain errors; only `.onError` translates them to HTTP responses.

Most routes (Cars, Rides) require `isFullyOnboarded`. User profile routes use `isAuthenticated`.

The `users.userRole` column (`USER` / `ADMIN`, default `USER`) drives `requireAdmin`. The role is not user-settable through any API surface — neither auth (`input: false` in better-auth `additionalFields`) nor admin tooling (the admin user-management endpoints filter out admin rows entirely; see `AdminRepository.visibleUserConditions`). The dev admin lives in `db/seed.ts` (`admin@example.com` / `admin1234`); promoting another user is a manual `UPDATE users SET user_role = 'ADMIN' WHERE email = '...'` against the database.

### Database schema (`apps/api/src/db/schema/`)

Schema is defined with Drizzle ORM in `apps/api`, not in `packages/db`. Key design decisions:

- All PostgreSQL enums are defined in `enums.ts` and imported by table files.
- Enum values (string arrays) live in `apps/api/src/shared/status-values.ts` and are shared with Zod schemas.
- **Soft deletes** via `deletedAt` timestamp column — filtered with `isNull(table.deletedAt)` in queries.
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

- **TanStack Router** — code-based routing in `apps/web/src/router.tsx`. Pages live in `apps/web/src/pages/`; the router file maps URLs to page components and injects layout state + navigation callbacks.
- **`react-router-dom` is NOT installed.** Pages currently import `useNavigate`/`useLocation`/`useSearchParams` from `apps/web/src/lib/router-compat.ts` — a shim that mirrors react-router-dom v7's API on top of TanStack Router. New code should prefer TanStack Router APIs (`useNavigate` from `@tanstack/react-router`, typed search params via `Route.useSearch()`); the shim is a transitional helper.
- **Layout state** (`language`, `theme`) lives in `LayoutProvider` (`apps/web/src/lib/layout-context.tsx`). Pages access it via `useLayout()` (or by being instantiated through the router with layout props injected). Do not lift this state back to `App.tsx`.

### CI (GitLab)

`.gitlab-ci.yml` runs four jobs in parallel on every MR and push: `lint`, `format`, `typecheck`, `build`. All must pass before merge.
