# Project Review: Waymate

**Date:** 2026-06-25
**Reviewer:** University Project Review skill (Fasaloft/skills · `university-project-review`)

---

## Project Orientation

Waymate is a carpooling web application built as a **Bun workspace monorepo** orchestrated by **Turborepo** (`turbo.json`, root `package.json` → `workspaces: ["apps/*", "packages/*", "e2e"]`). The backend `apps/api/` is an **Elysia** server on the Bun runtime (port 3000) with a strict per-domain layered architecture under `src/modules/` (`auth`, `users`, `cars`, `rides`, `bookings`, `reviews`, `reports`, `blocks`, `chat`, `statistics`, `health`). Larger domains (`rides`, `bookings`) are further decomposed into sub-folders (`creation`, `lifecycle`, `search`, `listing`, `eta`, `admin`). The frontend `apps/web/` is **React 19 + Vite + Tailwind CSS 4** with **TanStack Router** (file-based routing in `src/routes/`) and an **Orval-generated TanStack Query** client (`src/api-client/`). Shared Zod schemas live in `packages/shared/src/*.schema.ts` and feed the OpenAPI spec that drives the web codegen.

Detected stack: **Drizzle ORM + PostgreSQL** (schema in `apps/api/src/db/schema/`, 14 committed SQL migrations), **better-auth** (email/password + Google OAuth), **pino** structured logging, **react-hook-form + @hookform/resolvers + zod** forms, **Vitest** (26 API + 15 web unit specs) plus a **Playwright** e2e suite (`e2e/`, 8 specs, excluded from CI). CI is GitLab (`.gitlab-ci.yml`) with parallel lint / format / typecheck / i18n / test / build / migration-drift jobs. The project is notably mature for a university submission — request hardening (body-size limit + in-memory rate limiter), soft deletes, status-history audit tables, and trigger-managed `updated_at` are all present.

---

## Review Summary

| Category              | Status      |
| --------------------- | ----------- |
| Component Library     | ✅ Good      |
| Styling               | ✅ Good      |
| Loading Data          | ✅ Good      |
| Environment Variables | ✅ Good      |
| REST API Design       | ✅ Good      |
| Database              | ✅ Good      |
| BE Design Patterns    | ✅ Good      |
| Auth                  | ✅ Good      |
| Testing               | ✅ Good      |
| Logging & Monitoring  | ✅ Good      |
| Error Handling        | ✅ Good      |
| Security              | ✅ Good      |
| Forms                 | ✅ Good      |
| Frontend Structure    | ✅ Good      |

Status legend: ✅ Good | ⚠️ Concerns | ❌ Issues | N/A

---

## Detailed Review

### 1. Component Library

**Status:** ✅ Good

A dedicated component library `@waymate/ui` (`0.1.63`) is the primary UI layer and is used consistently — 97 import sites across `apps/web/src` (`grep "from \"@waymate/ui\""`). It is supplemented by Radix primitives (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`) for accessible menus/selects. The codebase actively guards against bypassing the library: `apps/web/src/features/admin/components/FilterSelect.tsx:17` documents a `no-restricted-syntax` ESLint rule forbidding raw `<select>`. Of the 11 raw interactive elements found, all but one are mock components inside `*.test.tsx` files; the single production case is a native `<input type="checkbox">` in `apps/web/src/components/shared/ReportUserModal.tsx:173`, correctly wired to react-hook-form via `{...register("blockTarget")}`.

**Recommendations:**

1. None required. The native `<input type="checkbox">` in `ReportUserModal.tsx:173` is intentional: `@waymate/ui` (consumed here as a built package, not linked source) exports no checkbox component — its surface is `Button`, `Input`, `Textarea`, `SegmentedControl`, `DatePicker`, `Modal`, etc. The element is accessible, labeled, and wired to react-hook-form, so it stays as-is. Adding a `Checkbox` to the external `waymate-ui` library would be the only way to route it through the library, which is out of this repo's scope.

---

### 2. Styling

**Status:** ✅ Good

Tailwind CSS 4 (`@tailwindcss/vite`) is the styling system, with a single global stylesheet `apps/web/src/index.css`. Inline `style={{}}` appears only **3 times**, and every instance is a genuinely dynamic, data-driven value that cannot be a static class: a progress-bar width `width: ${(r.count/max)*100}%` (`routes/admin/-components/PopularRoutesCard.tsx:43`) and a color-swatch `backgroundColor: c.hex` (`routes/car/add/-components/ColorField.tsx:36`). No Tailwind arbitrary-value or hardcoded-hex abuse was found in JSX.

**Recommendations:**

1. The only `!important` usage is `index.css:104-105` (`overflow: unset !important; margin-right: 0 !important;`) — a scroll-lock override. Add a comment naming the library/behavior it counteracts so a future reader doesn't remove it blindly.

---

### 3. Loading Data

**Status:** ✅ Good

TanStack Query is the data layer, consumed through Orval-generated hooks in `src/api-client/`. There are **65** `useQuery`/`useMutation`/`useInfiniteQuery` call sites and **zero** direct `fetch`/`axios` calls inside components (`grep` for `await fetch(`/`axios.` in `*.tsx` returned nothing outside the generated client and the `lib/geocoding` adapter). Cache keys are stable, generated arrays used via helpers like `getGetRidesMeQueryKey()` (e.g. `features/passenger/hooks/useCreateBooking.ts:38-44` invalidates `bookings/me`, `rides/available`, and `rides/search` after a mutation) — no fragile string keys.

**Recommendations:**

1. None.

---

### 4. Environment Variables

**Status:** ✅ Good

`.gitignore` ignores `.env` and `.env.*` while explicitly un-ignoring `!.env.example` and `!.env.test.example`. A thorough `apps/api/.env.example` is committed with placeholders and inline documentation for every variable. Env access is centralized — `process.env`/`Bun.env` reads are funnelled through `apps/api/src/config/env.ts` (the only stray `process.env` read is a legitimate `NODE_ENV` guard in `db/seed.ts:51`). No hardcoded `localhost:PORT`, connection strings, or API keys were found in application source (external service defaults like OSRM/Photon are documented env-overridable fallbacks).

**Recommendations:**

1. None.

---

### 5. REST API Design

**Status:** ✅ Good

Routes are resource-oriented and consistent. Collections are plural nouns (`/rides`, `/bookings`, `/cars`, `/reviews`, `/blocks`, `/conversations`); creation is `POST /<collection>` returning **201** (8 `status(201, …)` sites, e.g. `cars/car.routes.ts:93`, `rides/ride.routes.ts:157`). State-machine transitions follow a uniform `PATCH /:id/<action>` convention rather than verb-in-path POSTs:

- `PATCH /rides/:id/{cancel,end,complete}`
- `PATCH /bookings/:id/{cancel,confirm,reject}` (+ `/:id/driver/cancel`)
- `PATCH /cars/:id/status`, `PATCH /admin/users/:id/status`, `PATCH /reviews/:id/status`, `PATCH /reports/:id/status`

No verb-in-path anti-patterns (`/getUser`, `/createPost`) exist. The one non-collection `POST /rides/estimate-eta` is a deliberate, documented complex-body read. Request validation uses shared Zod schemas registered in `z.globalRegistry`, and `PUT` is intentionally absent — partial updates use `PATCH`.

**Recommendations:**

1. ~~Minor: confirm the delete endpoints return a consistent shape.~~ **Resolved.** All three `DELETE` routes deliberately return `200` with a body (none use `204`), which suits the soft-delete model. The lone shape outlier — `DELETE /cars/:id` returned the full `Car` entity while `DELETE /blocks/:blockedUserId` and `DELETE /admin/reviews/:id` return a lightweight `{ id }`-style ack — was aligned: `DELETE /cars/:id` now returns `DeleteCarResponse` (`{ id }`), matching the other two. The route maps the service result to `{ id }` at the HTTP layer, leaving the service's richer return (still asserted by its tests) intact.

---

### 6. Database

**Status:** ✅ Good

Schema is Drizzle ORM across ~27 well-separated table files in `apps/api/src/db/schema/`, with explicit relations (`relations.ts`) and FK references (e.g. `ride_stops.city_id → cities(id)`). Migrations are versioned: **14** committed SQL files in `apps/api/drizzle/`, and CI enforces drift via the `migration-drift` job. No `bytea`/`blob`/`base64` image columns exist — binary assets are kept out of the DB. Raw `sql\`\`` appears only as **parameterized Drizzle template fragments** for aggregates and computed columns (`statistics.repository.ts` `to_char(...)` grouping, `AVG(...)::float`, a Haversine distance ORDER BY in `booking-request.repository.ts:91`, an advisory lock in `chat.repository.ts:104`) — all column/value interpolation is bound, none is string concatenation of user input. Dedicated status-history tables provide a full transition audit trail.

**Recommendations:**

1. None.

---

### 7. Backend Design Patterns

**Status:** ✅ Good

Layer separation is textbook and enforced: **14** `*.routes.ts`, **23** `*.service.ts`, **22** `*.repository.ts`. The architectural rules hold under inspection — `grep` for a `db` import in `*.routes.ts` returns **nothing** (no DB access leaking into the HTTP layer), and `db.transaction` appears **only** in service files (11 services), never in a repository. Repositories take an `Executor` (`Database | Tx`) first arg and stay pure; services own transactions, business validation, and error translation; routes map domain errors to HTTP status in `.onError`.

**Recommendations:**

1. None. This is the strongest category in the project.

---

### 8. Auth

**Status:** ✅ Good

Authentication is **better-auth** (`^1.6.8`) with a Drizzle adapter, supporting email/password and Google OAuth — no roll-your-own auth (`grep` for `jsonwebtoken`/`jwt.sign`/`bcrypt.hash`/`crypto.createHash` in `apps/api/src` returned nothing). Authorization (not just authentication) is present via three composable Elysia macros — `isAuthenticated`, `isFullyOnboarded`, `requireAdmin` — used across 13 route files, plus ownership/role checks in services (driver-only and admin-only transitions). The `users.userRole` column is non-user-settable (`input: false` in better-auth, filtered out of admin tooling).

**Recommendations:**

1. None.

---

### 9. Testing

**Status:** ✅ Good

Tests are present, meaningful, and **none are skipped** (`grep` for `.skip`/`xit`/`xdescribe`/`.todo(` returned 0). Coverage spans **26** API specs, **15** web specs, and **8** Playwright e2e flows. The API suite tests real business logic and authorization, not trivial snapshots — e.g. `ReportService.submitReport`, `BookingService.createBookingRequest`, plus route-level "Authorization & Onboarding Guards" and "Negative Tests" describe blocks. The `test` CI job provisions a throwaway `postgres:18` service and migrates it via Vitest `globalSetup`.

**Recommendations:**

1. Consider wiring the Playwright e2e suite into a (possibly manual/nightly) CI stage — it currently runs only locally.

---

### 10. Logging & Monitoring

**Status:** ✅ Good

Structured logging uses **pino** (`^10.3.1`) via a single configured `logger` (`apps/api/src/shared/logger.ts`), JSON in production and pretty in development, with Authorization/Cookie headers and `*.password`/`*.token` fields redacted. Request-lifecycle logging (`requestId`, method, path, status, durationMs) lives in the root app hooks. The **11** `console.log` calls are all in CLI scripts that run outside the request logger (`db/seed.ts`, `db/reset.ts`) — an intentional, documented exception. No logging of passwords/tokens/secrets was found.

**Recommendations:**

1. None.

---

### 11. Error Handling

**Status:** ✅ Good

The backend has a root catch-all `.onError` (`apps/api/src/index.ts:223`) plus per-module `.onError` factories that map typed domain errors (`AuthError`, `RideError`, `BookingError`, …) to HTTP status, log 500-class errors with stack + `requestId`, and avoid logging 4xx as errors. The frontend surfaces errors properly — 159 `isError`/`onError`/`ErrorBoundary` references and a router-wide `RouteErrorBoundary` default. The only "empty" catch is `signOut().catch(() => {})` in `routes/onboarding.tsx:84` — a deliberate fire-and-forget on logout, not a silent swallow of meaningful failure.

**Recommendations:**

1. None.

---

### 12. Security

**Status:** ✅ Good

CORS is an explicit **allowlist**, not a wildcard — `cors({ origin: allowedOrigins, credentials: true, … })` (`index.ts:157`), with origins derived from `WEB_ORIGIN`/`CORS_ORIGINS`. No hardcoded secrets were found in source. All DB access is through Drizzle with parameterized `sql\`\`` fragments (no string interpolation of user input). `.gitignore` covers `.env`/`.env.*`. Beyond the basics, the app adds defense-in-depth: a per-IP in-memory rate limiter (global + stricter per-route caps), a `Content-Length` body-size limit returning `413`, and `X-Forwarded-For` parsing hardened against client spoofing via `TRUSTED_PROXY_COUNT`.

**Recommendations:**

1. Production hardening note (not a code defect): the rate limiter is in-process and resets on restart / is per-replica — back it with Redis if a strict shared limit is required at scale (already documented in `CLAUDE.md`).

---

### 13. Forms

**Status:** ✅ Good

Forms use **react-hook-form** (`^7.74.0`) with **@hookform/resolvers** + **zod** schema validation — **79** `useForm`/`Controller`/`zodResolver` references across 46 `<form>`/`onSubmit` sites. The form-as-useState anti-pattern is absent: the highest `useState` density is `LocationAutocomplete.tsx` (7), which is genuine autocomplete widget state (query, results, open, highlighted index, loading) rather than hand-rolled form fields; form-bearing routes like `register.tsx` (3) delegate field state to `useForm`. Validation schemas are shared from `packages/shared`, not duplicated as manual `if` checks.

**Recommendations:**

1. None.

---

### 14. Frontend Structure

**Status:** ✅ Good

The structure is strong — **54+** custom `use*` hooks extract logic out of components, **21** TanStack Router `loader`/`beforeLoad` usages place critical fetches in the route layer, and routes are decomposed into `-components/`/`-hooks/` co-located private modules. No god-components exist.

The original ⚠️ flagged a cluster of admin list `index.tsx` files (`admin/reviews` 258 ln, `admin/reports` 229 ln, `admin/users` 217 ln) that mixed page orchestration with inline selection/modal/mutation state. **This has been resolved.** The modal/selection/mutation orchestration was extracted into co-located action hooks matching the existing `use*Filters` pattern:

- `admin/reviews/-hooks/useAdminReviewsActions.ts`
- `admin/reports/-hooks/useAdminReportsActions.ts`
- `admin/users/-hooks/useAdminUsersActions.ts`

The three pages are now lean orchestrators that compose `useFilters` + `useList` + `useActions` into markup — **129 / 125 / 126 lines** respectively (down from 258 / 229 / 217). Typecheck, ESLint, and the full 91-test web suite pass after the change.

**Recommendations:**

1. Apply the same `use<Entity>Filters` + `use<Entity>List` + `use<Entity>Actions` triad to any future list/detail page so route files stay lean.
2. Treat ~250 lines as the soft ceiling that triggers decomposition of a route component.
3. No action needed on the API side — backend service/repository files top out at 432 lines and are mostly declarative query builders, which is acceptable for that file type.

---

## Overall Assessment

This is an exceptionally mature submission for a university software-engineering course, with strict backend layering, enforced migration/lint/i18n CI gates, real authorization, redacted structured logging, and production-grade request hardening that goes well beyond course expectations. The one Frontend Structure concern raised in the initial pass — a few admin list pages carrying inline selection/modal state — has since been refactored into co-located action hooks, so **all fourteen categories are now clean ✅**.
