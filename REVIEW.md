# University Project Review — Waymate

_Two-phase, 14-category review per the `university-project-review` skill._
_Date: 2026-06-23 · Branch: `Decompose`_

---

## Phase 1 — Project Orientation

**Type:** Full-stack carpooling web app (student project).

**Architecture:** Bun-workspace monorepo orchestrated by Turborepo (`turbo.json`, root `package.json` workspaces `apps/*`, `packages/*`, `e2e`).

| Area | Stack |
| --- | --- |
| Frontend (`apps/web`) | React 19 + Vite 7 + Tailwind CSS 4, TanStack Router (file-based) + TanStack Query, react-hook-form + Zod v4, react-i18next (en/cs/sk), `@waymate/ui` design system |
| Backend (`apps/api`) | Elysia (Bun runtime, port 3000), Drizzle ORM + PostgreSQL, better-auth, pino logging, `@elysiajs/openapi` |
| Data layer | Orval-generated TanStack Query client from the committed OpenAPI spec (`apps/web/src/api-client/`) |
| Packages | `packages/shared` (Zod schemas), `packages/db` (stub) |
| Tooling | ESLint + Prettier, Vitest (api + web), Playwright (`e2e/`), GitLab CI with parallel `verify` stage |

`.env.example` is thorough and self-documenting. README, `documentation/`, and `CLAUDE.md` all present. Modules follow a consistent `routes / service / repository / types / errors` layout, several already sub-divided (`rides/creation`, `rides/lifecycle`, `bookings/lifecycle`, …). Overall this reads as a mature, deliberately-engineered codebase rather than a typical student prototype.

---

## Phase 2 — Status Summary

| # | Category | Status |
| --- | --- | --- |
| 1 | Component Library | ✅ Good |
| 2 | Styling | ✅ Good |
| 3 | Loading Data | ✅ Good |
| 4 | Environment Variables | ✅ Good |
| 5 | REST API Design | ✅ Good |
| 6 | Database | ✅ Good |
| 7 | Backend Design Patterns | ✅ Good |
| 8 | Auth | ✅ Good |
| 9 | Testing | ✅ Good |
| 10 | Logging & Monitoring | ✅ Good (minor) |
| 11 | Error Handling | ✅ Good |
| 12 | Security | ✅ Good |
| 13 | Forms | ✅ Good |
| 14 | Page Decomposition | ⚠️ Concerns |

---

## Detailed Findings

### 1. Component Library — ✅ Good
The shared `@waymate/ui` library is imported in **91** `.tsx` files under `apps/web/src` and used consistently for `Button`, modals, cards, etc. (e.g. `apps/web/src/routes/passenger/rides/index.tsx:8`). The only raw `<button>` elements found are inside test stubs (`PassengerRideList.test.tsx`, `DriverRideList.test.tsx`), used deliberately as click targets — not in production UI.

### 2. Styling — ✅ Good
Tailwind CSS 4 via `@tailwindcss/vite`. A repository-wide search for inline styles (`style={{`) returns **1** occurrence (`apps/web/src/components/navigation/AdminNavbar.tsx`). No ad-hoc CSS sprawl.

**Recommendation:** 1) Confirm the single inline style in `AdminNavbar.tsx` isn't a value expressible with a Tailwind utility/CSS var.

### 3. Loading Data — ✅ Good
All API access flows through Orval-generated TanStack Query hooks (`useGetBookingsMe`, etc.) behind a custom fetcher (`apps/web/src/lib/api-fetcher.ts`). Route loaders prefetch into the Query cache to avoid render waterfalls (`apps/web/src/routes/passenger/rides/index.tsx:31-38`). No component fetches the app API directly. The only raw `fetch` is to the external Photon geocoding service (`apps/web/src/lib/geocoding/photon.ts:126`), which is a third-party API outside the OpenAPI surface — acceptable.

### 4. Environment Variables — ✅ Good
`apps/api/.env.example` documents every variable with rationale. Env is parsed and validated through a Zod schema with custom origin validation (`apps/api/src/config/env.ts`) that fails loud on misconfiguration. No `.env` files are tracked in git; no hardcoded secret patterns found in source.

### 5. REST API Design — ✅ Good
Resource-oriented plural collections with correct verbs: `GET` for reads, `POST /<collection>` returning **`status(201)`** for creation (8 occurrences), and **`PATCH /<collection>/:id/<action>`** for state-machine transitions (`booking.routes.ts:121-218`, `ride.routes.ts:217-274`). The convention is applied uniformly across modules.

### 6. Database — ✅ Good
Drizzle ORM schema split per-table under `apps/api/src/db/schema/`. **14** committed migrations in `apps/api/drizzle/` (CI enforces drift via `migration-drift`). Strong design: `timestamptz(6)` everywhere, trigger-managed `updated_at`, soft deletes with partial unique indexes scoped to `WHERE deleted_at IS NULL`, dedicated status-history tables, per-segment pricing. No blobs in the DB.

### 7. Backend Design Patterns — ✅ Good
Clean layered separation enforced project-wide: `*.routes.ts` (HTTP) → `*.service.ts` (business logic + transactions) → `*.repository.ts` (pure Drizzle, `Executor`-first). Verified the layering rule holds: `db.transaction()` appears only in **11 service files**, and a search for `.transaction(` in `*.repository.ts` returns **zero** hits. Repositories take `executor: Executor` as their first argument.

### 8. Auth — ✅ Good
better-auth (email/password + Google OAuth) with a Drizzle adapter. Three composable Elysia macros (`isAuthenticated`, `isFullyOnboarded`, `requireAdmin`) guard routes — **26** guard usages across `*.routes.ts`. Crucially, **authorization** (not just authentication) is enforced in services via ownership checks, e.g. `if (ride.driverId !== driverId)` (`bookings/lifecycle/booking-lifecycle.service.ts:25,113,227`) and self-review prevention (`reviews/review.service.ts:10`). The `user_role` column is not user-settable through any API surface.

### 9. Testing — ✅ Good
**41** test files; **217** `it`/`test` cases in the API suite alone, plus web component tests and a Playwright `e2e/` suite. A search for `.skip` / `.todo` / `xit` / `xdescribe` returns **0** — no disabled tests. CI runs the Vitest API suite against a throwaway `postgres:18` container.

### 10. Logging & Monitoring — ✅ Good (minor)
Structured pino logging (`apps/api/src/shared/logger.ts`) with header/field redaction, JSON in prod / pretty in dev, request-lifecycle logging (`requestId`, method, path, status, `durationMs`) in the root app. API `console.*` is confined to OpenAPI tooling and CLI scripts (seed/reset/env), as intended.

**Concerns (minor):** 1) The frontend has **9** `console.error` calls in auth/submit catch blocks (`login.tsx:89`, `register.tsx:85`, `onboarding.tsx:147`, `useOfferRideSubmit.ts:103,115`, …) — fine for a client app, but consider routing them through a single client logger/telemetry sink. 2) Domain services rarely emit their own log lines; most observability is request-scoped at the root. Add a few `logger.info` calls on key transitions (ride created, booking confirmed) if you want richer audit signals.

### 11. Error Handling — ✅ Good
Typed domain errors per module (`*.errors.ts`) thrown by services and macros, then translated to HTTP status by `.onError` mappers (`*ErrorToHttpStatus`) — verified across booking, ride, review, chat, car, report, block, auth modules. Macros throw `AuthError` rather than returning inline statuses. 500-class errors are logged with stack + `requestId`; expected 4xx domain errors are not logged as errors. Errors surface to the frontend with stable codes consumed by route-level `-lib/*-errors.ts` helpers.

### 12. Security — ✅ Good
- **CORS** configured with an explicit origin allowlist, `credentials: true`, scoped methods/headers, and preflight caching (`apps/api/src/index.ts:157-178`); origins are Zod-validated.
- **Request hardening:** body-size limit (413) and an in-memory fixed-window rate limiter with per-route caps (429 + `Retry-After`), with spoof-resistant client-IP extraction via `TRUSTED_PROXY_COUNT`.
- **No secrets in repo**; no hardcoded credentials.
- **SQL injection:** all raw `sql\`…\`` usages (statistics, chat, geo-distance search) interpolate columns/values through Drizzle's parameterized tagged templates — no string concatenation of user input.
- Privilege escalation closed off (`user_role` not settable; admin rows filtered from admin tooling).

### 13. Forms — ✅ Good
react-hook-form is used in **19** components with **12** `zodResolver` integrations (e.g. `routes/car/add/`, `routes/driver/offer/`, register/onboarding flows), reusing the shared Zod schemas. Form state lives in `useForm`, matching the project convention. The remaining `useState` usage is for UI/orchestration state (tabs, modal open/close), not form fields.

### 14. Page Decomposition — ⚠️ Concerns
The branch is actively improving this (commit _"Decompose large fe components"_) and the pattern is strong: routes co-locate `-components/`, `-hooks/`, and `-lib/` modules, list rendering and view-mapping are extracted (`passenger/rides/-components/PassengerRideList.tsx`, `-lib/passenger-ride-view.ts`). No non-generated file exceeds the ~400-line decomposition threshold (largest are `photon.ts` 354 — a lib, and `AdminNavbar.tsx` 307).

**Concerns:** A few route components remain heavy orchestrators rather than lean shells:
- `apps/web/src/routes/passenger/rides/index.tsx` (~226 lines) holds ~10 `useState` hooks (cancel target, rating modal + 4 rating fields, report target, tab) plus a `useEffect` sync — the rating-modal and report-modal state clusters could move into dedicated hooks (`useRateDriverFlow`, `useReportFlow`) mirroring the existing `-hooks/` pattern.
- `apps/web/src/routes/rides.tsx` (278 lines) and the driver counterpart carry similar inline orchestration.

**Recommendations:**
1. Extract the rating + report modal state clusters in `passenger/rides/index.tsx` (and its driver twin) into co-located `-hooks/`, leaving the route component as an orchestrator that wires hooks to the already-extracted list components.
2. Give `routes/rides.tsx` the same `-components` / `-hooks` treatment the newer routes received.

---

## Overall Assessment

This is an **exemplary** student project. Twelve of fourteen categories pass cleanly; the two flagged items (frontend logging hygiene, residual orchestration state in a couple of route components) are minor polish rather than defects. The backend layering discipline, transaction placement, security hardening, migration/audit-trail rigor, and test coverage exceed typical coursework expectations. Highest-value next step: finish the route-component decomposition already underway on this branch.
