# Project Review: Waymate

**Date:** 2026-06-25
**Reviewer:** University Project Review skill (Fasaloft/skills · `university-project-review`)

---

## Project Orientation

Waymate is a carpooling web application built as a **Bun workspace monorepo** orchestrated by **Turborepo** (`turbo.json`, root `package.json` → `workspaces: ["apps/*", "packages/*", "e2e"]`). The backend `apps/api/` is an **Elysia** server on the Bun runtime (port 3000) with a strict per-domain layered architecture under `src/modules/` (`auth`, `users`, `cars`, `rides`, `bookings`, `reviews`, `reports`, `blocks`/`blocklist`, `chat`, `statistics`, `health`). The frontend `apps/web/` is **React 19 + Vite + Tailwind CSS 4** with **TanStack Router** (file-based routing in `src/routes/`) and an **Orval-generated TanStack Query** client (`src/api-client/`). Shared Zod schemas live in `packages/shared/src/*.schema.ts` and feed the OpenAPI spec that drives the web codegen.

Detected stack: **Drizzle ORM + PostgreSQL** (schema in `apps/api/src/db/schema/`, 14 committed SQL migrations), **better-auth** (email/password + Google OAuth), **pino** structured logging, **react-hook-form + @hookform/resolvers + zod** forms, **Vitest** (API + web unit) plus a **Playwright** e2e suite (`e2e/`, excluded from CI). CI is GitLab (`.gitlab-ci.yml`) with parallel lint / format / typecheck / i18n / test / build / migration-drift jobs. The project is notably mature for a university submission — request hardening (body-size limit, in-memory rate limiter), soft deletes, status-history audit tables, and trigger-managed `updated_at` are all present.

---

## Review Summary

| Category              | Status        |
| --------------------- | ------------- |
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

The project consumes a dedicated external component library, **`@waymate/ui`**, imported in **94** places across `apps/web/src` (`grep "from \"@waymate/ui\""`), supplemented by headless **`@radix-ui`** primitives (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`) for menus/selects. Raw interactive HTML elements are nearly absent in real product code: only **13** total occurrences of `<button|input|select|textarea>`, and **10 of those are inside test files** (`PassengerRideList.test.tsx`, `DriverRideList.test.tsx`). The three remaining are defensible: `navbar-shared.tsx:136` uses a raw `<button>` inside a `.map()` for nav items, and `FilterSelect.tsx` / `ReportUserModal.tsx` each have one. No hand-rolled duplicates of library components were found.

**Recommendations:**

1. Optional: confirm the raw `<button>` in `apps/web/src/components/navigation/navbar-shared.tsx:136` couldn't reuse the library `Button` (it may be intentional for the bottom-nav layout — fine to leave if so).

---

### 2. Styling

**Status:** ✅ Good

Tailwind CSS 4 is the styling system (`@tailwindcss/vite`). Inline `style={{}}` appears only **3 times**, and every instance is legitimately dynamic and could not be a static class: a color swatch background (`car/add/-components/ColorField.tsx:36` → `backgroundColor: c.hex`), a chart/route color (`admin/-components/PopularRoutesCard.tsx:43`), and a computed grid template (`navbar-shared.tsx:135` → `gridTemplateColumns: repeat(${items.length}, …)`). There are **0** Tailwind arbitrary-value hacks (`[12px]`, `[#aabbcc]`) and only **2** `!important` occurrences. This is disciplined, design-token-aligned styling.

**Recommendations:**

1. None required. The dynamic inline styles are correct usage.

---

### 3. Loading Data

**Status:** ✅ Good

Data access is fully routed through **TanStack Query** via the Orval-generated client (`useQuery`/`useMutation` used **65** times). There are **0** direct `fetch(`/`axios.` calls inside `.tsx` components — the only fetcher is the central `apps/web/src/lib/api-fetcher.ts` mutator. Cache keys are stable, generated arrays produced by Orval's `getGetXQueryKey()` helpers (e.g. `useDriverRideRequests.ts:54` → `getGetRidesMeQueryKey()`, `useChatPanel.ts:182` → `getGetConversationsQueryKey()`), and invalidation is centralized in thin wrapper hooks under `src/features/*/hooks/`. No fragile string keys were found.

**Recommendations:**

1. None required. This is exemplary query-layer hygiene.

---

### 4. Environment Variables

**Status:** ✅ Good

`.gitignore` ignores `.env` and `.env.*` while explicitly un-ignoring `!.env.example` and `!.env.test.example`. Both `apps/api/.env.example` and `apps/web/.env.example` are committed and unusually well documented (every optional var has an explanatory comment block). No hardcoded `localhost:PORT`, connection strings, or secrets were found in source — the single `process.env` read outside the env layer is a benign `NODE_ENV === "production"` guard in `db/seed.ts:51`. Env access is centralized and validated in `apps/api/src/config/env.ts`.

**Recommendations:**

1. None required.

---

### 5. REST API Design

**Status:** ✅ Good

Across the 14 `*.routes.ts` files the verb distribution is **19 GET, 9 POST, 11 PATCH, 2 DELETE, and 0 PUT**. No verb-in-path anti-patterns were found. Collections are plural nouns and state-machine transitions follow a uniform `PATCH /<collection>/:id/<action>` convention (cancel/confirm/reject/complete/end/status) rather than `POST /:id/action` — a deliberate, documented choice. Request/response validation is centralized in `packages/shared/*.schema.ts` Zod schemas registered with the OpenAPI spec, so contracts are well-defined and machine-checked. The absence of any PUT side-steps the common student PUT-as-partial-update mistake entirely.

**Recommendations:**

1. None required. This is a textbook resource-oriented design.

---

### 6. Database

**Status:** ✅ Good

The schema is decomposed cleanly into ~25 per-table files under `apps/api/src/db/schema/` with a dedicated `relations.ts`, `enums.ts`, and `timestamps.ts` helper. There are **14 versioned SQL migrations** in `apps/api/drizzle/` (CI has a `migration-drift` job that fails if they drift from the schema). No `bytea`/`blob`/base64 image columns exist — binary assets are kept out of the DB. All `sql` usage (statistics aggregations, the haversine distance in `booking-request.repository.ts:91`, the advisory lock in `chat.repository.ts:104`) is **parameterized Drizzle `sql` templates** with `${}` bound as query parameters, not string concatenation. UUID PKs via `defaultRandom()` are used consistently; soft deletes use partial unique indexes scoped to `WHERE deleted_at IS NULL`.

**Recommendations:**

1. None required. Migration management and schema modeling are well above the expected level.

---

### 7. Backend Design Patterns

**Status:** ✅ Good

Layer separation is clean and enforced: **14 routes / 23 services / 22 repositories**, with larger domains further split into sub-folders (`rides/creation`, `rides/lifecycle`, `bookings/lifecycle`, `*/admin`). A grep for `db.`/`drizzle` in `*.routes.ts` returns **nothing** — no DB access leaks into the HTTP layer. `db.transaction` appears **only in service files** (11 services) and **never** in repositories or routes, exactly matching the documented layering rule (repositories take an `Executor = Database | Tx` and stay pure). Service files are sensibly sized (largest: `booking-lifecycle.service.ts` at 262 lines, `ride-lifecycle.service.ts` at 254) — all within the ~300-line guideline.

**Recommendations:**

1. Minor: the admin repositories are the largest files in the backend (`admin-review.repository.ts` 432 lines, `admin-report.repository.ts` 404). They are pure query collections so size is acceptable, but if any single query function mixes filtering + pagination + joins, consider extracting query-builder helpers for readability.

---

### 8. Auth

**Status:** ✅ Good

Authentication uses **better-auth** (`^1.6.8`) with a Drizzle adapter — there is **zero** roll-your-own crypto (`grep jsonwebtoken|jwt.sign|bcrypt.` → 0 hits). Authorization, not just authentication, is present and layered: three Elysia macros (`isAuthenticated`, `isFullyOnboarded`, `requireAdmin`) guard routes, and **32** module files contain ownership/role checks (`user.role`, `FORBIDDEN`, `driverId ===`, etc.). The `users.userRole` column is non-user-settable (`input: false` in better-auth, filtered out of admin tooling), closing the privilege-escalation vector. Guards throw typed `AuthError` and only `.onError` maps to HTTP — consistent and correct.

**Recommendations:**

1. None required.

---

### 9. Testing

**Status:** ✅ Good

Test coverage is substantial for a student project: **26** API test files (`apps/api`), **15** web test files (`apps/web`), and **8** Playwright e2e specs (`e2e/tests`). **Zero** tests are skipped (`grep .skip|xit|xdescribe|.todo` → 0). The API suite runs in CI against a throwaway `postgres:18` service container with migration-based global setup, so tests exercise real service/repository/DB integration rather than trivial snapshots.

**Recommendations:**

1. Optional: wire the Playwright `e2e/` suite into CI (it currently runs locally only) so regressions in critical user flows are caught automatically.

---

### 10. Logging & Monitoring

**Status:** ✅ Good

Structured logging uses **pino** (`^10.3.1`) via a single configured `logger` instance (`apps/api/src/shared/logger.ts`) with Authorization/Cookie/`*.password`/`*.token` redaction. There are **0** `console.log`/`console.debug` calls in non-CLI API source — the only `console.*` usage is intentionally confined to CLI scripts (`db/seed.ts`, `db/reset.ts`) and the env-validation failure path that runs before the logger exists. Request lifecycle logging (requestId, method, path, status, durationMs) and 500-class error logging with stack + requestId are implemented in the root app hooks. No sensitive values are logged.

**Recommendations:**

1. None required.

---

### 11. Error Handling

**Status:** ✅ Good

The backend has a consistent error-mapping discipline: **10** modules register an `.onError`/`createErrorHandler` that translates typed domain errors (`AuthError`, `RideError`, `AdminError`, …) into HTTP status codes, with a root catch-all for 500s. No empty `catch(e) {}` swallow blocks were found in `apps/api/src` or `apps/web/src`. The frontend surfaces errors prominently — **117** occurrences of `isError`/`ErrorBoundary`/`RouteErrorBoundary` across components, and the router wires `RouteErrorBoundary` as the default error component (`router.tsx`).

**Recommendations:**

1. None required.

---

### 12. Security

**Status:** ✅ Good

CORS is explicitly configured with an **allowlist** (`apps/api/src/index.ts:157` → `cors({ origin: allowedOrigins })`) derived from validated `WEB_ORIGIN`/`CORS_ORIGINS` env vars — **no wildcard `*`** anywhere. No hardcoded API keys/secrets/tokens were found in source. All DB access goes through Drizzle with parameterized `sql` templates (no string-interpolated SQL — see Category 6). `.gitignore` covers `.env`/`.env.*`. Beyond the rubric, the app adds request-body-size limits (HTTP 413) and an IP-based rate limiter with spoofing-resistant `X-Forwarded-For` handling (`TRUSTED_PROXY_COUNT`).

**Recommendations:**

1. Production note (not a code defect): the rate limiter keeps counters in process memory, so it is per-replica. If deployed with more than one instance and strict limits matter, back it with Redis — already acknowledged in the code comments.

---

### 13. Forms

**Status:** ✅ Good

Forms use **react-hook-form** (`^7.74.0`) with **`@hookform/resolvers`** + **Zod** schema validation — `useForm` appears in **28** places, matched against **15** files containing `<form>`/`onSubmit`. No form-as-`useState` anti-pattern was found: the files with the most `useState` calls (`admin/reviews/index.tsx` with 9, `admin/reports/index.tsx` with 7) hold **filter/pagination/modal UI state** (`statusFilter`, `ratingFilter`, `searchInput`, `isDetailOpen`, `selectedReviewId`), not hand-rolled form fields. Validation is schema-driven via resolvers rather than manual `if` checks, and this aligns with the project's own documented convention that form state belongs in `useForm`.

**Recommendations:**

1. None required.

---

### 14. Frontend Structure

**Status:** ⚠️ Concerns

Decomposition is generally strong: **50** custom `use*` hooks extract logic out of components, route-private `-components/` folders are used widely, and no route file is a true "god component" — the largest is `admin/reviews/index.tsx` at **285 lines**, and the heaviest files (admin review/report/user screens) are filter-and-table orchestrators that already delegate to `-components/` modals. The one real concern is **fetch placement**: TanStack Router is in use, but only **2** routes (`driver/rides/index.tsx`, `passenger/rides/index.tsx`) fetch via route `loader`s, while ~**17** route components call `useQuery`/`useGet*` hooks directly in their bodies. Per the rubric's preference, critical data fetches should move into `loader`/`beforeLoad` to enable parallel loading and avoid request waterfalls.

**Recommendations:**

1. Migrate the most data-critical route components (e.g. `routes/rides.tsx`, `routes/admin/users/index.tsx`, `routes/driver/rides/passengers/index.tsx`) to fetch their primary data in a route `loader`, using `queryClient.ensureQueryData` with the Orval query options so the cache stays shared with the in-component hooks.
2. Keep the current loader pattern from `driver/rides` and `passenger/rides` as the reference implementation when converting the rest.
3. Optional: `admin/reviews/index.tsx` (285 lines, 9 `useState`) is near the size threshold — consider extracting the filter bar + its state into a small `useReviewFilters()` hook to keep the page a lean orchestrator.
