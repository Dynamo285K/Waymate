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

Database (run from `apps/api/`):
```bash
bun run db:generate  # generate Drizzle migrations
bun run db:migrate   # apply migrations
```

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

The API runs on port **3000** in dev mode. Swagger docs are available via `@elysiajs/swagger`.

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

| File | Responsibility |
|---|---|
| `*.routes.ts` | HTTP route definitions, request validation, error-to-status mapping |
| `*.service.ts` | Business logic orchestration |
| `*.repository.ts` | All database queries (Drizzle ORM) |
| `*.schema.ts` | Zod schemas for request/response validation |
| `*.types.ts` | TypeScript types derived from schemas |
| `*.errors.ts` | Plain string error constants thrown by the repository |

Current modules: `auth`, `users`, `cars`, `rides`, `bookings` (stub), `health`.

### Authentication and authorization

Auth is handled by **better-auth** (`apps/api/src/modules/auth/auth.ts`) with a Drizzle adapter targeting PostgreSQL. It supports email/password and Google OAuth.

Two Elysia macros guard routes:
- `isAuthenticated` — requires a valid session; injects `user` and `session` into context
- `isFullyOnboarded` — additionally requires `user.firstName` and `user.lastName` to be set; returns `403 ONBOARDING_REQUIRED` otherwise

Most routes (Cars, Rides) require `isFullyOnboarded`. User profile routes use `isAuthenticated`.

### Database schema (`apps/api/src/db/schema/`)

Schema is defined with Drizzle ORM in `apps/api`, not in `packages/db`. Key design decisions:

- All PostgreSQL enums are defined in `enums.ts` and imported by table files.
- Enum values (string arrays) live in `apps/api/src/shared/status-values.ts` and are shared with Zod schemas.
- **Soft deletes** via `deletedAt` timestamp column — filtered with `isNull(table.deletedAt)` in queries.
- **Status history tables** (`ride_status_history`, `booking_status_history`, `user_status_history`) provide a full audit trail of every status transition; always insert a history record when updating status.
- **Ride stops** use a 0-indexed `stopOrder` integer. Stop 0 is the origin; the last stop is the destination. Prices are per-segment (a `prices` row references `startStopId` → `endStopId`), not a flat per-ride price. When creating a ride, the client sends stop orders; the repository translates them to UUIDs inside a transaction.
- All ride/booking creation that spans multiple tables is wrapped in a `db.transaction()`.
- UUID primary keys generated via `defaultRandom()` (PostgreSQL `gen_random_uuid()`).

### Zod usage

The project uses **Zod v4**. Use `z.uuid()`, `z.url()`, `z.email()` directly (not `z.string().uuid()` etc.). Input schemas use `z.coerce.date()` for date fields coming from HTTP query/body.

### Frontend (`apps/web/`)

- Minimal scaffold — the actual UI is not yet implemented beyond a placeholder.
- Uses **`@waymate/ui`** (external component library from a separate GitLab repo `waymate-ui`). Must be cloned, built, and linked locally with `bun link` as described in the README.
- i18n via **react-i18next** with three locales: `en`, `cs`, `sk` (files in `apps/web/src/i18n/locales/`).

### CI (GitLab)

`.gitlab-ci.yml` runs four jobs in parallel on every MR and push: `lint`, `format`, `typecheck`, `build`. All must pass before merge.
