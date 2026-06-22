# Project Review: Waymate

**Date:** 2026-06-22

---

## Project Orientation

Waymate is a carpooling web application built as a **Bun workspace monorepo** orchestrated by **Turborepo** (`turbo.json`, root `package.json` workspaces `apps/*`, `packages/*`, `e2e`). It splits into `apps/api` — an **Elysia** backend on the Bun runtime — and `apps/web` — a **React 19 + Vite + Tailwind CSS 4** frontend. The backend uses **Drizzle ORM** against **PostgreSQL**, **better-auth** for authentication (email/password + Google OAuth), **pino** for structured logging, and **Zod v4** for schema validation; shared Zod schemas live in `packages/shared`. The frontend consumes the API through an **Orval-generated TanStack Query client** (`apps/web/src/api-client/`), routes via **TanStack Router** (file-based routes in `apps/web/src/routes/`), uses **react-hook-form** for forms and an external `@waymate/ui` component library, and is internationalized with react-i18next (en/cs/sk). Testing is **Vitest** (22 API test files, 5 web) plus a Playwright `e2e/` suite; CI runs lint, format, typecheck, i18n-check, tests, build, and migration-drift on GitLab. The codebase is mature and well-organized — far beyond a scaffold — with a consistent layered module structure (`*.routes.ts` / `*.service.ts` / `*.repository.ts` / `*.types.ts` / `*.errors.ts`) documented in `CLAUDE.md`.

---

## Review Summary

| Category              | Status      |
| --------------------- | ----------- |
| Component Library     | ✅ Good     |
| Styling               | ✅ Good     |
| Loading Data          | ✅ Good     |
| Environment Variables | ✅ Good     |
| REST API Design       | ✅ Good     |
| Database              | ✅ Good     |
| BE Design Patterns    | ✅ Good     |
| Auth                  | ✅ Good     |
| Testing               | ✅ Good     |
| Logging & Monitoring  | ✅ Good     |
| Error Handling        | ✅ Good     |
| Security              | ✅ Good     |
| Forms                 | ✅ Good     |
| Frontend Structure    | ⚠️ Concerns |

Status legend: ✅ Good | ⚠️ Concerns | ❌ Issues | N/A

---

## Detailed Review

### 1. Component Library

**Status:** ✅ Good

The project depends on the external `@waymate/ui` library (`apps/web/package.json`) plus Radix primitives (`@radix-ui/react-select`, `@radix-ui/react-dropdown-menu`). It is imported and used in **77 places** across `.tsx` files. A scan for raw `<button>`/`<input>`/`<select>` elements returned a single hit — a _comment_ in `apps/web/src/features/admin/components/FilterSelect.tsx:17` explaining that the raw `<select>` is "forbidden by the no-restricted-syntax lint rule," confirming the bypass is actively guarded against by ESLint rather than tolerated.

**Recommendations:**

1. No action required. Keep the `no-restricted-syntax` lint rule that blocks raw form elements so the discipline holds as new contributors join.

---

### 2. Styling

**Status:** ✅ Good

Tailwind CSS 4 is the styling system. Inline `style={}` appears only **4 times**, and each is a legitimate dynamic-value case that cannot be expressed as a static class: `features/chat/components/ChatPanel.tsx:221` (`calc(100vh - 72px)`), `routes/car/add/-components/ColorField.tsx:36` (a user-picked color swatch), `routes/admin/index.tsx:301` (chart sizing), and `components/shared/LocationAutocomplete.tsx:137` (`position: relative`). Tailwind arbitrary values are rare and benign (mostly `[status]`-style data attributes, not magic pixel values). The only `!important` usages are two lines in `index.css:47-48` overriding third-party scroll-lock behavior — an acceptable, documented escape hatch.

**Recommendations:**

1. Optionally migrate the `ColorField` swatch (`-field-styles.ts` / `ColorField.tsx`) to a CSS custom property if you want to eliminate the last dynamic inline style, but this is cosmetic.

---

### 3. Loading Data

**Status:** ✅ Good

Data fetching goes through the **Orval-generated TanStack Query hooks** (`apps/web/src/api-client/`), used in **113 call sites** (`useGetX`/`usePostX`/…). There are **no direct `fetch`/`axios` calls in components** — the only raw `fetch` is in `lib/geocoding/photon.ts:125`, a third-party geocoding utility outside the API surface, which is the correct place for it. Cache keys use the generated stable key builders (`getGetRidesMeQueryKey()`, `getGetBookingsMeQueryKey()`, `getGetAdminReportsQueryKey({...})`, etc. — see `features/passenger/hooks/useCancelBooking.ts:31-37`), so invalidation is type-safe and not fragile string concatenation.

**Recommendations:**

1. No action required.

---

### 4. Environment Variables

**Status:** ✅ Good

`.env` and `.env.*` are git-ignored with an explicit `!.env.example` / `!.env.test.example` allowlist (`.gitignore`). Both apps ship a template (`apps/api/.env.example`, `apps/web/.env.example`), and the API one is thoroughly documented (CORS origins, body-size limit, trusted-proxy count, log level, auto-end tuning). Critically, env vars are **validated at boot through a Zod schema** in `apps/api/src/config/env.ts` (`EnvSchema`: `PORT` coerced int range-checked, `DATABASE_URL` non-empty, `BETTER_AUTH_URL` as `z.url()`, etc.), so misconfiguration fails loudly rather than silently. A secrets scan found no hardcoded keys, connection strings, or passwords in source.

**Recommendations:**

1. No action required.

---

### 5. REST API Design

**Status:** ✅ Good

This is exemplary. Collections are plural nouns (`/rides`, `/bookings`, `/cars`), creation is `POST /<collection>` returning **201** (`ride.routes.ts:152-156` → `status(201, …)`), and **state-machine transitions use `PATCH /:id/<action>`** uniformly — `PATCH /rides/:id/{cancel,end,complete}`, `PATCH /bookings/:id/{cancel,confirm,reject}` (`ride.routes.ts:216,244,273`; `booking.routes.ts:121-218`). Verb distribution across route files is sensible (29 GET, 15 PATCH, 9 POST, 3 DELETE — no verbs-in-paths abuse). The single non-collection `POST /rides/estimate-eta` (`ride.routes.ts:174`) is a deliberate, documented complex-body _read_. Each route declares a typed response map with correct status semantics (`400`/`403`/`404`/`413`/`429`/`500`).

**Recommendations:**

1. No action required. The conventions in `CLAUDE.md` are followed precisely.

---

### 6. Database

**Status:** ✅ Good

Schema is defined with Drizzle in `apps/api/src/db/schema/` (one file per table). It is a proper relational design with **41 `references()` foreign keys**, PostgreSQL enums centralized in `enums.ts`, UUID primary keys via `defaultRandom()`, soft deletes via `deletedAt` with partial unique indexes scoped to `WHERE deleted_at IS NULL`, and audit `*_status_history` tables. **No `bytea`/`blob` columns** store binary blobs. Migrations are **versioned incrementally** (`drizzle/0000_*.sql` … `0013_*.sql`), not a single dump, and CI enforces migration drift. All `sql\`…\`` usages are parameterized Drizzle template literals (CHECK constraints, partial-index predicates) — no user-input string interpolation.

**Recommendations:**

1. No action required.

---

### 7. Backend Design Patterns

**Status:** ✅ Good

The layered architecture is rigorously enforced. Repository functions take an `executor: Executor` as their first argument (`ride.repository.ts:75,128,190`) and contain pure Drizzle queries. **`db.transaction()` appears only in the service layer** (and the seed script) — `ride.service.ts`, `booking.service.ts`, `car.service.ts`, the admin services, `report.service.ts`, `chat.service.ts` — never in a repository. Routes delegate to services and only map domain errors to HTTP. The one minor smell is **`ride.service.ts` at 718 lines** (`booking.service.ts` 444, `admin.routes.ts` 479), above the ~200–300 line guideline.

**Recommendations:**

1. Consider splitting `apps/api/src/modules/rides/ride.service.ts` (718 lines) into cohesive sub-services — e.g. ride creation/route-stop translation vs. lifecycle transitions (cancel/end/complete) vs. queries — to keep each unit under ~300 lines.

---

### 8. Auth

**Status:** ✅ Good

Authentication uses the **better-auth** framework with a Drizzle adapter (`apps/api/src/modules/auth/auth.ts`), supporting email/password and Google OAuth. There is **no hand-rolled `jsonwebtoken`/`bcrypt`** anywhere — the red-flag scan returned nothing. Authorization is enforced through three composable Elysia macros (`isAuthenticated`, `isFullyOnboarded`, `requireAdmin`) that **throw typed `AuthError`s** caught centrally, and services perform **resource-ownership checks** (e.g. `booking.service.ts:197,285,399` `if (ride.driverId !== driverId)`; `review.service.ts:10` self-review guard). The `userRole` column is not settable through any API surface.

**Recommendations:**

1. No action required.

---

### 9. Testing

**Status:** ✅ Good

There are **22 API test files** and **5 web test files** (excluding generated client), covering services, repositories, routes, middleware, the rate limiter, time utils, and auto-end logic — i.e. real business/integration logic, not trivial snapshots. **Zero tests are marked `.skip`/`.todo`.** Vitest is configured in both apps with a CI `test` job that provisions a throwaway `postgres:18` container and migrates it before running. A Playwright `e2e/` suite exists (not wired into CI by design).

**Recommendations:**

1. Optionally add the Playwright `e2e/` suite to a nightly or manual CI pipeline so end-to-end coverage doesn't drift, since it currently runs only locally.

---

### 10. Logging & Monitoring

**Status:** ✅ Good

Structured logging uses **pino** (`apps/api/src/shared/logger.ts`) with Authorization/Cookie/Set-Cookie headers and `*.password`/`*.token` fields redacted before serialization. Request-lifecycle logging (`requestId`, method, path, status, durationMs) lives in the root `.onRequest`/`.onAfterResponse`, and 500-class errors log full stacks with the request id. The 17 `console.*` calls in API source are **confined to CLI scripts** (`db/reset.ts`, `db/seed.ts`) that run outside the request logger — appropriate. No secrets are logged. On the frontend, a handful of `console.error(...)` calls exist in auth/offer flows (`login.tsx`, `register.tsx`, `onboarding.tsx`, `driver/offer/index.tsx`), which is acceptable for a browser app but could be centralized.

**Recommendations:**

1. Optionally route the frontend `console.error` calls through a small shared logger/error-reporting helper so they can later be wired to a monitoring service (e.g. Sentry) without touching each call site.

---

### 11. Error Handling

**Status:** ✅ Good

**No empty `catch {}` blocks** exist anywhere in `apps/`. The backend uses a consistent pattern: services throw plain-string domain errors (`*.errors.ts`), and per-module `.onError` handlers map them to HTTP status codes, with a root `.onError` catch-all for 500s. Each route declares its error response shapes (`400`/`404`/`409`/`413`/`429`). The frontend surfaces errors rather than spinning forever — **149 references** to `toast.*`/`isError`/`FieldError`/error rendering across components (sonner toasts, a dedicated `FieldError.tsx`, `BookingErrorModal.tsx`, `RouteErrorBoundary.tsx`).

**Recommendations:**

1. No action required.

---

### 12. Security

**Status:** ✅ Good

CORS is **explicitly allowlisted**, not wildcard: `cors({ origin: allowedOrigins, credentials: true, … })` where `allowedOrigins` is built from `env.WEB_ORIGIN` + validated `CORS_ORIGINS` (`apps/api/src/index.ts:53,157`). The API adds request hardening in `.onRequest`: a body-size limit (413) and an in-memory fixed-window **rate limiter** (429 with `Retry-After`, global + per-route caps), with client IP read at a trusted-proxy offset to prevent spoofing. All DB access is through Drizzle (no raw string interpolation of user input), `.env*` is git-ignored, and no secrets are hardcoded. better-auth provides DB-backed rate limiting for `/api/auth/*`.

**Recommendations:**

1. As already noted in `CLAUDE.md`, back the in-memory rate limiter with Redis before running multiple API replicas, since counters are currently per-process.

---

### 13. Forms

**Status:** ✅ Good

Forms use **react-hook-form** (`useForm` in 18 components) wired to **Zod validation via `@hookform/resolvers` `zodResolver`** (12 files), with schemas co-located (`routes/car/add/-schema.ts`, `routes/driver/offer/-components/schema.ts`, etc.). There is **no form-as-useState anti-pattern**: the files with high `useState` counts are genuine UI state, not form fields — `forgot-password.tsx` (multi-step wizard: `step`, `countdown`, `showPw`, …) and `passenger/rides/index.tsx` (tab selection, modal toggles, optimistic ride state). Validation errors are rendered through the shared `FieldError` component.

**Recommendations:**

1. No action required.

---

### 14. Frontend Structure

**Status:** ⚠️ Concerns

The overall structure is strong: routes follow the page-as-orchestrator pattern, delegating to co-located `-components/` and `-hooks/` directories (e.g. `routes/admin/reports/{-components,-hooks,-lib}`, `routes/driver/offer/{-components,-hooks,-lib}`), and logic is extracted into many custom `use*.ts` hooks (`useRideSearch`, `useDriverDashboardData`, `useEtaPreview`, …). Data fetching uses TanStack Query hooks rather than ad-hoc fetches in component bodies. The concern is a small number of **route files that exceed the ~400-line god-component threshold**: `routes/driver/offer/index.tsx` (**460 lines**), and several approaching it — `routes/admin/index.tsx` (355), `routes/driver/profile/index.tsx` (339), `routes/passenger/rides/index.tsx` (320). Navigation components (`AdminNavbar` 378, `DriverNavbar` 361, `PassengerNavbar` 348) are also large.

**Recommendations:**

1. Decompose `apps/web/src/routes/driver/offer/index.tsx` (460 lines) — it already has a `-components/` folder; move the remaining orchestration-heavy markup and the car-deletion side-effect logic (`console.error("Failed to delete unused car")` around line 379) into sub-components/hooks to bring it under ~300 lines.
2. Extract shared navbar structure from `AdminNavbar`/`DriverNavbar`/`PassengerNavbar` (~360–380 lines each) into a common `Navbar` shell plus role-specific link configs to reduce duplication and size.
3. Review `routes/admin/index.tsx` and `routes/driver/profile/index.tsx` for further hook/sub-component extraction as they trend toward the threshold.
