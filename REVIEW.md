# Project Review: Waymate

**Date:** 2026-06-23

---

## Project Orientation

Waymate is a carpooling web application built as a Bun-workspace monorepo orchestrated by Turborepo. The frontend (`apps/web`) is React 19 + Vite + Tailwind CSS 4 with TanStack Router (file-based routing) and TanStack Query for server state; the backend (`apps/api`) is an Elysia server on the Bun runtime using Drizzle ORM against PostgreSQL, with better-auth for authentication. Shared Zod schemas live in `packages/shared` and are reused by both the API (OpenAPI generation) and the web client (Orval-generated TanStack Query hooks). `packages/db` is a stub — the schema actually lives in `apps/api/src/db/schema`.

The API is organized into 13+ domain modules (`rides`, `bookings`, `cars`, `reviews`, `reports`, `blocks`, `chat`, `users`, `statistics`, `auth`, `health`) each following a strict `routes → service → repository` layering with co-located `*.errors.ts` and `*.types.ts`. Larger domains (rides, bookings, reviews) are further decomposed into sub-folders (`creation/`, `lifecycle/`, `search/`, `admin/`). The frontend mirrors this with route-private `-components/`, `-hooks/`, `-lib/` folders. Notable infrastructure beyond a typical student project: pino structured logging with redaction, an in-memory rate limiter, request-body-size limiting, a real-time chat WebSocket layer, OSRM-based ETA estimation, H3 geospatial route-cell indexing, soft deletes with partial unique indexes, status-history audit tables, and a Playwright e2e suite. This is a mature, production-shaped codebase rather than a skeleton.

---

## Review Summary

| Category              | Status         |
| --------------------- | -------------- |
| Component Library     | ✅ Good        |
| Styling               | ✅ Good        |
| Loading Data          | ✅ Good        |
| Environment Variables | ✅ Good        |
| REST API Design       | ✅ Good        |
| Database              | ✅ Good        |
| BE Design Patterns    | ✅ Good        |
| Auth                  | ✅ Good        |
| Testing               | ✅ Good        |
| Logging & Monitoring  | ✅ Good        |
| Error Handling        | ✅ Good        |
| Security              | ✅ Good        |
| Forms                 | ✅ Good        |
| Frontend Structure    | ⚠️ Concerns    |

Status legend: ✅ Good | ⚠️ Concerns | ❌ Issues | N/A

---

## Detailed Review

### 1. Component Library

**Status:** ✅ Good

The project consumes a dedicated, in-house design system `@waymate/ui` (`apps/web/package.json:23`), imported in 92 component files (`grep "from \"@waymate/ui\""`). Radix primitives (`@radix-ui/react-select`, `@radix-ui/react-dropdown-menu`) are used as the accessible foundation rather than hand-rolled dropdowns. Library usage is consistent and not bypassed: of the 12 raw interactive-element matches, almost all are inside test files (e.g. `apps/web/src/routes/driver/rides/-components/DriverRideList.test.tsx:24` uses bare `<button>` purely as assertion click-targets, with a comment saying so). The team has even codified the rule — `apps/web/src/features/admin/components/FilterSelect.tsx:16-17` documents a `no-restricted-syntax` lint rule that forbids raw `<select>` and wraps Radix Select instead. The only genuine raw element in app code is a native `<input type="checkbox">` in `apps/web/src/components/shared/ReportUserModal.tsx:173`, which is a reasonable use of a styled native checkbox.

**Recommendations:**

1. None required. Optionally, expose a checkbox primitive from `@waymate/ui` so `ReportUserModal.tsx:173` can drop its last raw element, but this is cosmetic.

---

### 2. Styling

**Status:** ✅ Good

Tailwind CSS 4 is the styling approach and it is applied cleanly. Inline `style={{}}` appears exactly once across the whole frontend — `apps/web/src/components/navigation/AdminNavbar.tsx:118` (`style={{ cursor: onLogoClick ? "pointer" : "default" }}`), a dynamic value that is awkward to express in Tailwind, so it is defensible. Tailwind arbitrary-value abuse is essentially absent (2 matches total). The only `!important` usages are two lines in `apps/web/src/index.css:88-89`, and they are intentional and documented: overriding Radix's `body[data-scroll-locked]` scroll-lock because the dropdowns are not modals. Design tokens (`text-primary`, `text-text-secondary`, `accent-primary`) are used instead of hardcoded hex colors.

**Recommendations:**

1. None required.

---

### 3. Loading Data

**Status:** ✅ Good

TanStack Query is the data layer, used through Orval-generated hooks (`useGetBookingsMe`, `useGetRidesAvailable`, …) — 65 query/mutation call sites in app code. There are **zero** direct `fetch`/`axios`/`.then()` calls inside components (the grep for `await fetch(`/`axios.` in `.tsx` returned nothing); the only `fetch` in the codebase is centralized in `apps/web/src/lib/api-fetcher.ts` (the Orval mutator) and the Photon geocoding helper. Cache keys are stable arrays produced by generated `getGet…QueryKey()` helpers, and invalidation is done correctly against those keys after mutations (e.g. `apps/web/src/features/passenger/hooks/useCancelBooking.ts:31-37` invalidates `bookingsMe`, `ridesAvailable`, and `ridesSearch`). Mutations/queries are always invoked through hooks, never instantiated manually.

**Recommendations:**

1. None required.

---

### 4. Environment Variables

**Status:** ✅ Good

`.gitignore` correctly ignores `.env` and `.env.*` while explicitly un-ignoring the templates (`.gitignore:19-22`: `!.env.example`, `!.env.test.example`). Verified that no real env file is tracked: `git ls-files | grep .env` returns only `apps/api/.env.example`, `apps/api/.env.test.example`, and `apps/web/.env.example`. The example files are thorough and document every variable (`DATABASE_URL`, `BETTER_AUTH_URL`, CORS origins, rate-limit tuning, OSRM URL, etc.) with placeholder values. No hardcoded connection strings, ports, or API keys leak into source — the only `process.env` access outside `config/env.ts` is a `NODE_ENV` guard in the seed script (`apps/api/src/db/seed.ts:51`). Config is centralized and validated in `apps/api/src/config/env.ts`.

**Recommendations:**

1. None required.

---

### 5. REST API Design

**Status:** ✅ Good

Routes are resource-oriented and consistent: collections are plural nouns and state transitions follow a uniform `PATCH /<collection>/:id/<action>` convention (29 GET, 15 PATCH, 9 POST, 3 DELETE handlers). There are **no** verb-in-path anti-patterns (the `/getX`, `/createX`, `/doX` grep returned nothing). Notably the project made a deliberate REST decision documented in `CLAUDE.md`: no `PUT` handlers exist at all (`grep ".put(" ... → none`), because every mutation is either a creation (`POST`) or a status-machine transition (`PATCH`), avoiding the classic student mistake of using `PUT` for partial updates. Status codes are semantic rather than blanket-200: creations return `201` (8 handlers), and the centralized error-to-status maps in each `*.errors.ts` cover `400/401/403/404/409/413/429/500` appropriately (e.g. `409` for conflicts, `404` for not-found). Request/response validation uses Zod schemas from `packages/shared`. The one non-collection `POST` (`/rides/estimate-eta`) is a documented, read-only complex-body computation.

**Recommendations:**

1. None required. The REST conventions here are more disciplined than most production codebases.

---

### 6. Database

**Status:** ✅ Good

The schema is a well-normalized relational design in `apps/api/src/db/schema/` (~30 table files) with explicit foreign keys and a dedicated `relations.ts`. Migrations are properly versioned — 14 sequential SQL files in `apps/api/drizzle/` (`0000_…` through `0013_…`), not a single regenerated dump, and CI enforces drift via a `migration-drift` job. UUID primary keys are used consistently (`uuid("id").primaryKey().defaultRandom()` across tables). No blob/binary columns store files — the `bytea/blob/base64/imageData` grep over the schema returned nothing. Raw SQL via the Drizzle `sql\`\`` helper is used only where genuinely warranted (date bucketing in `statistics.repository.ts`, a haversine distance ordering in `booking-request.repository.ts:91`, an advisory lock in `chat.repository.ts:104`) — all parameterized through Drizzle, never string-interpolated user input. Timestamps use `timestamptz(6)` with a trigger-managed `updatedAt`, and soft deletes are paired with partial unique indexes scoped to `WHERE deleted_at IS NULL`.

**Recommendations:**

1. None required.

---

### 7. Backend Design Patterns

**Status:** ✅ Good

Layer separation is textbook and strictly enforced. 59 layered files (`*.routes.ts` / `*.service.ts` / `*.repository.ts`) follow the documented rule that repositories are pure Drizzle data access taking an `Executor` first, services own all business logic and transactions, and routes only map errors to HTTP. This was verified, not just assumed: `db.transaction(...)` appears in 11 service files and **zero** repository files; route files contain **no** direct `db.` usage and **no** imports of the `db` module. Large domains are further split by concern (e.g. `rides/creation`, `rides/lifecycle`, `rides/search`, `rides/admin`), keeping individual files focused. Service files stay within a healthy size band — the largest data-access file is `admin-review.repository.ts` at 432 lines, but it is a query-heavy repository, and the largest *service* files (`booking-lifecycle.service.ts` 262, `ride-lifecycle.service.ts` 254) are within the 200–300 guideline.

**Recommendations:**

1. The two ~430-line admin repositories (`admin-review.repository.ts`, `admin-report.repository.ts`) are approaching the point where splitting list-query builders from detail-query builders would aid readability. Low priority.

---

### 8. Auth

**Status:** ✅ Good

Authentication uses the **better-auth** library (`apps/api/package.json`) with a Drizzle adapter, supporting email/password and Google OAuth — there is no roll-your-own auth (the `jsonwebtoken`/`jwt.sign`/`bcrypt.hash`/`crypto.createHash` grep returned nothing). Authorization, not just authentication, is present and layered: three composable Elysia macros (`isAuthenticated`, `isFullyOnboarded`, `requireAdmin`) guard routes, and resource-ownership is enforced at the domain level — e.g. the `RIDE_NOT_FOUND_OR_NOT_OWNER` error (`ride.errors.ts:7`) deliberately collapses not-found and not-owner so the API does not leak resource existence to non-owners. The `users.role` column is not settable through any API surface (better-auth `input: false`, and admin tooling filters admin rows out entirely). 42 authorization-related references across modules confirm checks are pervasive, not an afterthought.

**Recommendations:**

1. None required.

---

### 9. Testing

**Status:** ✅ Good

Testing is a clear strength: 49 test files (26 API, 15 web, 8 Playwright e2e), with **zero** skipped/`todo` tests. Tests are meaningful rather than trivial — the API suite covers route protection and authorization guards (`index.test.ts`: unauthenticated rejection, `requireAdmin`, `isFullyOnboarded`), the rate limiter, time-zone day-boundary logic, and per-module service/route behavior including negative/validation paths (`report.routes.test.ts` has explicit "Negative Tests" and "Authorization & Onboarding Guards" describe blocks). The frontend tests use Testing Library on view-model logic and components. Vitest is the runner (configured in both apps), and CI runs the API suite against a throwaway PostgreSQL container. Test pyramid shape (unit/integration heavy, e2e thin) is appropriate.

**Recommendations:**

1. The Playwright e2e suite is excluded from CI (per `CLAUDE.md`). Consider running at least a smoke subset in a nightly pipeline so e2e coverage does not silently rot.

---

### 10. Logging & Monitoring

**Status:** ✅ Good

Structured logging uses **pino** (`apps/api/package.json`), with a single configured `logger` instance (`apps/api/src/shared/logger.ts`) that is JSON in production and pretty-printed in development, gated by `LOG_LEVEL`. Critically, Authorization/Cookie/Set-Cookie headers and `*.password`/`*.token` fields are redacted before serialization, and a request-lifecycle logger emits one structured `request` line per request with `requestId`, method, path, status, and duration. There are **zero** `console.log` calls in frontend app code (excluding tests/generated client). The 11 `console.*` calls in API source are all in the seed script (`db/seed.ts`), which legitimately runs outside the request logger as a CLI. The `console.error` calls in the web auth flows (`login.tsx`, `register.tsx`, `onboarding.tsx`) log failures rather than swallowing them, and none log secrets (the password/token-in-log grep returned nothing).

**Recommendations:**

1. None required.

---

### 11. Error Handling

**Status:** ✅ Good

Error handling is rigorous on both ends. Backend: there are **no** empty `catch {}` blocks (the regex grep returned nothing); domain errors are typed string constants thrown by services, caught by per-module `.onError` factories (`createErrorHandler`), and mapped to correct HTTP status codes, with a root `.onError` catch-all in `index.ts:223` for anything that bypasses a module handler. 500-class errors are logged with full stack + requestId, while expected 4xx domain errors are not logged as errors. Frontend: 141 error-state references across components, a `RouteErrorBoundary` wired as the router's `defaultErrorComponent` (with its own test), per-feature error modals (`BookingErrorModal`, `ReportUserModal`), and `getErrorI18nKey` mapping API errors to localized messages. The `return null` matches found in repositories are intentional not-found sentinels (e.g. `if (!row) return null`), not swallowed errors.

**Recommendations:**

1. None required.

---

### 12. Security

**Status:** ✅ Good

CORS is explicitly configured against an allowlist (`apps/api/src/index.ts:157-158`, `origin: allowedOrigins` derived from validated `WEB_ORIGIN`/`CORS_ORIGINS`) — **not** a wildcard (`origin: "*"` grep returned nothing). No secrets are hardcoded in source (the api_key/secret/password literal grep returned nothing; the only credentials are `admin1234`-style dev passwords in `db/seed.ts`, which is acceptable for a local seed and guarded against `NODE_ENV=production`). Database access is exclusively through Drizzle with parameterized `sql\`\`` fragments — no string-interpolated SQL injection surface. `.gitignore` covers `.env` files and no real env file is tracked. Beyond the basics, the app adds request-body-size limiting (413), an IP-based rate limiter with spoof-resistant `X-Forwarded-For` parsing (`TRUSTED_PROXY_COUNT`), and log redaction — hardening well above course expectations.

**Recommendations:**

1. The in-memory rate limiter is per-instance and resets on restart (already documented in `CLAUDE.md`). If deployed to multiple replicas, back it with Redis for a strict shared limit. Not a concern for the current scope.

---

### 13. Forms

**Status:** ✅ Good

Forms use **react-hook-form** (`apps/web/package.json`) with **Zod** schema validation wired through `@hookform/resolvers` — `zodResolver` appears at 24 call sites and `useForm`/`Controller` across 23 files. There is no form-as-useState anti-pattern: the files with 4+ `useState` calls (e.g. `passenger/rides/index.tsx` with 10) were inspected and the state is UI state — tabs, modal open/close, optimistic-update holders, report targets (`passenger/rides/index.tsx:36-61`) — **not** form fields with manual `handleChange`/validation. Real forms (car add, offer ride, onboarding, profile edit) go through react-hook-form with field-level validation and rendered error messages (`FieldError` component, `report.blockUserHint`, etc.). Validation schemas are shared with the backend via `packages/shared`, so client and server validate against the same contracts.

**Recommendations:**

1. None required.

---

### 14. Frontend Structure

**Status:** ⚠️ Concerns

Overall the frontend structure is strong: logic is well extracted into 39 custom hooks (`useDriverDashboardData`, `useChatPanel`, `useOfferRideSubmit`, …), routes use the file-based `-components/`/`-hooks/`/`-lib/` convention to keep concerns separated, and pure view-model transforms live in `-lib/*.ts` files with their own unit tests (`driver-ride-view.test.ts`, `passenger-ride-view.test.ts`). No route file is a runaway god-component — the largest page is `admin/reviews/index.tsx` at 285 lines, comfortably within the ~300 guideline, and the largest component overall is `AdminNavbar.tsx` at 307.

The one genuine concern is **fetch placement**. The project uses TanStack Router, whose `loader`/`beforeLoad` functions are the idiomatic place for critical data fetches (enabling parallel loading and avoiding request waterfalls), but **zero** routes define a data `loader:` — all server data is fetched with TanStack Query hooks inside component bodies (e.g. `passenger/rides/index.tsx:58` calls `useGetBookingsMe` in the component, and 13 route `index.tsx` files fetch this way). `beforeLoad` is used, but only for auth guards (`requireAudience`), not data. This is a defensible and very common React-Query pattern, but it does forgo router-level parallel loading and means data fetching starts only after the component mounts.

**Recommendations:**

1. For data-critical routes (e.g. `passenger/rides`, `driver/rides`, the admin tables), consider prefetching in the route `loader` via `queryClient.ensureQueryData(...)` using the generated query options, then reading the same query in the component. This keeps the React Query cache as the single source of truth while moving the fetch start earlier and enabling parallel loading. Apply selectively to the heaviest routes rather than wholesale.
2. Low priority: `AdminNavbar.tsx` (307) and `RideCard.tsx` (295) are the two largest components — verify they are composed of sub-units rather than one dense render, and extract sub-components if any single one mixes several visual concerns.
