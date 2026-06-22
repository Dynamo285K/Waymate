# Project Review: Waymate

**Date:** 2026-06-22

---

## Project Orientation

Waymate is a carpooling app built as a **Bun workspace monorepo** orchestrated by **Turborepo**, with `apps/api` (Elysia backend on the Bun runtime), `apps/web` (React 19 + Vite + Tailwind CSS 4), a Playwright `e2e/` workspace, and two near-stub packages (`packages/shared` for Zod schemas, `packages/db` is empty scaffolding). The backend uses **Drizzle ORM** over PostgreSQL (`postgres` driver), **better-auth** for authentication, **pino** for logging, and **Zod v4** for validation; the schema is split across 27 files under `apps/api/src/db/schema/` with 14 committed SQL migrations in `apps/api/drizzle/`. The frontend consumes the API through an **Orval-generated TanStack Query client** (`apps/web/src/api-client/`), routes with **TanStack Router**, and renders through an external **`@waymate/ui`** component library. The codebase is mature and consistently structured — well beyond "scaffolding" — with a documented layered backend (routes → service → repository), request hardening (rate limiting, body-size limits), and a CI pipeline (`.gitlab-ci.yml`) covering lint, format, typecheck, i18n drift, the Vitest API suite, build, and migration-drift.

---

## Review Summary

| Category              | Status         |
| --------------------- | -------------- |
| Component Library     | ✅ Good         |
| Styling               | ✅ Good         |
| Loading Data          | ✅ Good         |
| Environment Variables | ✅ Good         |
| REST API Design       | ✅ Good         |
| Database              | ✅ Good         |
| BE Design Patterns    | ✅ Good         |
| Auth                  | ✅ Good         |
| Testing               | ✅ Good         |
| Logging & Monitoring  | ✅ Good         |
| Error Handling        | ✅ Good         |
| Security              | ✅ Good         |
| Forms                 | ✅ Good         |
| Frontend Structure    | ⚠️ Concerns    |

Status legend: ✅ Good | ⚠️ Concerns | ❌ Issues | N/A

---

## Detailed Review

### 1. Component Library

**Status:** ✅ Good

`@waymate/ui` is a real shared component library (pinned to `0.1.53` in `apps/web/package.json`) and it is used consistently — 77 import sites across `apps/web/src`. Raw interactive HTML elements are rare (5 hits) and each is justified: `src/components/shared/RouteErrorBoundary.tsx:29,36` (a fallback boundary that must not depend on app components), `src/components/shared/ReportUserModal.tsx:135,170`, and `src/features/admin/components/FilterSelect.tsx` which carries an explicit comment that the raw `<select>` is forbidden by a `no-restricted-syntax` lint rule — i.e. the team enforces library usage at the lint level.

**Recommendations:**

1. Audit the raw `<select>`/`<input>` in `ReportUserModal.tsx` — if `@waymate/ui` has equivalent primitives, switch to them for visual and a11y consistency with the rest of the app.

---

### 2. Styling

**Status:** ✅ Good

Tailwind CSS 4 is the styling approach. Inline `style={{…}}` is used sparingly (7 hits) and almost all are legitimate dynamic values that can't be Tailwind classes: `ColorField.tsx:36` (a swatch driven by a runtime color), `ChatPanel.tsx:221` (`height: calc(100vh - 72px)`), and conditional `cursor` in the navbars. No Tailwind arbitrary-value abuse (`[12px]`, `[#fff]`) was found, and only 2 `!important` occurrences exist.

**Recommendations:**

1. The `cursor: onLogoClick ? "pointer" : "default"` pattern repeated in `PassengerNavbar.tsx:130`, `DriverNavbar.tsx:137`, `AdminNavbar.tsx:189` could be a conditional Tailwind class (`className={onLogoClick ? "cursor-pointer" : "cursor-default"}`) to keep styling in one system. Minor.

---

### 3. Loading Data

**Status:** ✅ Good

TanStack Query is used pervasively and correctly — 341 query/mutation/queryClient references across `apps/web/src`, and **zero** direct `fetch`/`axios` calls inside components. Data flows through the Orval-generated client (`src/api-client/` with per-domain folders: `rides`, `bookings`, `chat`, `admin`, …). Query keys are stable arrays produced by generated helpers (`getGetRidesMeQueryKey()`, `getGetConversationsQueryKey()`) rather than fragile hand-written strings, and invalidation is handled in dedicated hooks (`useCancelRide.ts`, `useDriverRideRequests.ts`, `useChatPanel.ts`).

**Recommendations:**

1. None. This is exemplary for a student project.

---

### 4. Environment Variables

**Status:** ✅ Good

`.gitignore` ignores `.env` / `.env.*` while explicitly un-ignoring `.env.example` and `.env.test.example`. `apps/api/.env.example` is thorough and well-commented (DB URL, auth URL, CORS origins, body-size limit, trusted-proxy count, log level, ride auto-end tuning, Resend/Google OAuth). Env access is centralized and validated through `apps/api/src/config/env.ts` (Zod-validated, with a custom "bare origin" check) rather than scattered `process.env` reads.

**Recommendations:**

1. None.

---

### 5. REST API Design

**Status:** ✅ Good

Routes are resource-oriented and plural (`/rides`, `/bookings`, `/cars`, …) with no verb-in-path anti-patterns detected. Verb distribution across the 10 route modules is healthy: 29 GET, 15 PATCH, 9 POST, 3 DELETE. State transitions follow a deliberate, uniform `PATCH /<collection>/:id/<action>` convention (documented in `CLAUDE.md`), and `POST` on a non-collection path is reserved for one read-only complex-body endpoint (`/rides/estimate-eta`). Status codes are used intentionally (23 references to `201`/`204`/`409`/`status(` in route files), and all request/response schemas are Zod (`packages/shared`) registered into the OpenAPI spec.

**Recommendations:**

1. None blocking. As a polish item, spot-check that each creating `POST` returns `201` (not `200`) and that conflict transitions return `409` consistently — the convention is in place, just worth a final pass.

---

### 6. Database

**Status:** ✅ Good

The schema is well-normalized across 27 Drizzle files with status-history tables (`ride_status_history`, `booking_status_history`, `user_status_history`, `report_status_history`, `review_status_history`) providing a full audit trail. There are **14 versioned SQL migrations** in `apps/api/drizzle/` (not a single dump), and CI enforces migration drift. **No blob/`bytea`/base64 image columns** — binary data is correctly kept out of the DB. UUID PKs via `gen_random_uuid()`, timestamps standardized on `timestamptz`, soft deletes via `deletedAt` with partial unique indexes scoped to `WHERE deleted_at IS NULL`. The 15 raw-`sql` usages are all **parameterized Drizzle tagged templates** (e.g. `chat.repository.ts:104` `pg_advisory_xact_lock`, `admin-dashboard.repository.ts` `to_char` grouping) — not string concatenation — plus one static `TRUNCATE` in `seed.ts`.

**Recommendations:**

1. None blocking. `ride.repository.ts` is 1016 lines (see Backend Patterns) — consider splitting query groups, but the schema design itself is solid.

---

### 7. Backend Design Patterns

**Status:** ✅ Good

The layered pattern is real and enforced: every module has `*.routes.ts` / `*.service.ts` / `*.repository.ts` / `*.types.ts` / `*.errors.ts`. **No `db` import leaks into any `*.routes.ts`**, and **no `*.repository.ts` calls `db.transaction`** (0 hits) — transactions live exclusively in services (16 `db.transaction` sites). Repository functions take an `Executor` (`db | tx`) as their first argument, so the same query composes inside and outside a transaction. This is a textbook controller/service/repository separation, better than most student projects achieve.

**Recommendations:**

1. `ride.service.ts` (718 lines) and `booking.service.ts` (444 lines) exceed the ~200–300 line guideline. Consider extracting cohesive sub-flows (e.g. ride search vs. ride lifecycle) into separate service files or helper modules.

---

### 8. Auth

**Status:** ✅ Good

Authentication uses **better-auth** (declared in the root `package.json`) with a Drizzle adapter — **no roll-your-own JWT or bcrypt** (0 hits for `jsonwebtoken`/`jwt.sign`/`bcrypt.hash`). Authorization (not just authentication) is present and layered through three Elysia macros — `isAuthenticated`, `isFullyOnboarded`, `requireAdmin` (`apps/api/src/modules/auth/auth.middleware.ts:104,114`) — and the role column is not user-settable through any API surface (per `CLAUDE.md`). Guards throw typed `AuthError`s that `.onError` maps to HTTP, rather than returning inline. There is a dedicated `auth.middleware.test.ts` exercising the role/onboarding guards.

**Recommendations:**

1. Continue ensuring ownership checks (a user can only mutate their own rides/bookings) live in services — the structure is right; just keep coverage complete as new endpoints are added.

---

### 9. Testing

**Status:** ✅ Good

**22 API test files**, **5 web test files**, and **8 Playwright e2e specs** — and **zero skipped/`todo` tests**. Tests target real business logic and integration, not trivia: `describe` blocks cover request hardening, admin authorization/role guards, user moderation, rides management, reviews/reports moderation, and time-zone boundary logic (`dayBoundsInTimeZone`). The API suite runs in CI against a throwaway PostgreSQL service container with migrations applied in `globalSetup`.

**Recommendations:**

1. The Playwright e2e suite is intentionally excluded from CI (per `CLAUDE.md`). If feasible, run it on a nightly or pre-merge job so the happy-path flows don't silently rot.

---

### 10. Logging & Monitoring

**Status:** ✅ Good

Structured logging via **pino** (`pino` + `pino-pretty` for dev). **Zero `console.log`/`console.debug` in non-CLI API source** — the only `console.*` usage is in `db/seed.ts` and `db/reset.ts`, which are CLI scripts that intentionally run outside the request logger. The logger redacts Authorization/Cookie/Set-Cookie headers and `*.password`/`*.token` fields, emits one `request` log line per request with a `requestId`, and logs 500-class errors with full stack — proper observability hygiene.

**Recommendations:**

1. None.

---

### 11. Error Handling

**Status:** ✅ Good

A root `.onError` (`apps/api/src/index.ts:223`) plus a per-module error-handler factory (`auth.errors.ts:49`) form a consistent two-tier mapping of domain errors → HTTP status, with 4xx kept out of the error log and 5xx logged with stack + requestId. **No empty/silent catch blocks** were found in API or web source. The frontend surfaces errors broadly — 131 `isError`/`error:`/`ErrorBoundary` references — including a dedicated `RouteErrorBoundary.tsx`.

**Recommendations:**

1. None blocking.

---

### 12. Security

**Status:** ✅ Good

CORS is explicitly configured against a validated allow-list (`apps/api/src/index.ts:157` `cors({ origin: allowedOrigins })`, origins validated as bare origins in `config/env.ts`) — **no wildcard `*`**. No hardcoded secrets in source (env-driven, with a committed `.env.example` using placeholders). DB access is through Drizzle with parameterized queries — no string-interpolated SQL. Additional hardening beyond the checklist: in-process rate limiting (global + per-route caps) and a request body-size limit, both firing in `.onRequest` before handlers. `.gitignore` covers `.env*`.

**Recommendations:**

1. `CLAUDE.md` notes rate-limit counters are in-process (per-replica). If you ever run more than one API instance, back them with Redis for a strict shared limit — documented, not urgent.

---

### 13. Forms

**Status:** ✅ Good

Forms use **react-hook-form** (52 `useForm`/`Controller` sites) wired to **Zod** via `@hookform/resolvers/zod` (24 `zodResolver` sites). There is **no form-as-useState anti-pattern**: the files with the most `useState` are not hand-rolled forms — e.g. `forgot-password.tsx` (388 lines, 9 `useState`) uses `useForm` + `zodResolver` for the actual fields, and its `useState` calls are genuine UI/flow state (wizard `step`, resend `countdown`, `showPw` toggle, in-flight loading flags). `passenger/rides/index.tsx`'s `useState` count is filter/search UI state, not form fields.

**Recommendations:**

1. None blocking.

---

### 14. Frontend Structure

**Status:** ⚠️ Concerns

Mostly strong: **42 custom hooks** extract logic out of components (`useDriverRideRequests`, `useCancelBooking`, `useChatPanel`, …), TanStack Router is used heavily (73 `loader`/`createFileRoute`/`createRoute` references), and route directories use co-located `-components/` folders to decompose pages (`driver/offer/-components/CarSection.tsx`, `admin/rides/-components/RideDetailModal.tsx`). The concern is a cluster of route files pushing past the size guideline and likely mixing fetching, transformation, and rendering:

- `routes/driver/offer/index.tsx` — **460 lines**
- `routes/forgot-password.tsx` — **388 lines**
- `routes/admin/index.tsx` — **355 lines** (also one of the 2 inline `style={{}}` sites)
- `routes/driver/profile/index.tsx` — **339 lines**
- `routes/passenger/rides/index.tsx` — **320 lines** (10 `useState`)

These aren't god-components on the scale of an un-decomposed project (sub-component folders exist), but the largest few are candidates for further extraction.

**Recommendations:**

1. Read `routes/driver/offer/index.tsx` (460 lines) and pull the multi-step offer logic into a `useOfferForm`-style hook and additional `-components/`, so the route file is an orchestrator.
2. For `passenger/rides/index.tsx`, move the filter/sort state and any inline list transformation into a custom hook (the project already favors this pattern elsewhere).
3. Verify that critical reads in these large routes sit in TanStack Router `loader`s rather than `useQuery` in the component body, to avoid loading waterfalls.

---

## Cross-Cutting Cleanup (outside the 14 categories)

These don't affect a category status but are worth fixing:

1. **Stray scratch file at repo root** — `test_search.ts` is an ad-hoc script that imports `RideService` directly and `console.log`s results. It's not a real test (not under any test runner) and shouldn't be committed. Delete it.
2. **Misplaced / unused root dependencies** — the root `package.json` declares `@supabase/ssr`, `@supabase/supabase-js`, and `resend` as direct dependencies, but **Supabase is referenced 0 times** in `apps/`. These are dead deps (the project uses better-auth + its own Postgres). Remove the Supabase packages, and move genuinely app-specific deps (e.g. `resend`, `@waymate/ui`, `drizzle-orm`, `tailwindcss`) into the `package.json` of the app that actually uses them rather than the workspace root.
