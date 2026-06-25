# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. These instructions OVERRIDE default behavior — follow them exactly.

> **This is a production application, not a prototype.** Every convention below is written for a system that real users depend on, that runs on more than one instance, and that has to be operated, observed, and rolled back. Where a "quick local" shortcut exists, the production path is the rule and the shortcut is the exception — never the other way around.

> **Template note:** Replace `<PROJECT>`, `<domain>`, and the stack specifics with your project's values. The opinionated default stack below (Bun/Elysia/Drizzle/React 19/TanStack) is the one these conventions were proven on; swap libraries freely, but keep the *principles* (layering, typed errors, schema-as-contract, observability, CI gates).

## Project

`<PROJECT>` is a `<one-line description>` organized as a Bun workspace monorepo with Turborepo. Apps and packages share a single `bun.lock` and are orchestrated via `turbo.json`.

## Commands

All commands run from the repository root unless otherwise noted.

```bash
bun install          # install all workspace dependencies
bun run dev          # start all apps in watch mode (Turbo)
bun run build        # build all apps
bun run typecheck    # TypeScript check across the monorepo
bun run lint         # ESLint across the monorepo
bun run format:check # Prettier check (used in CI)
bun run test         # unit + integration suites
bun run test:e2e     # Playwright end-to-end suite (also a CI gate — see CI)
```

Database (scoped to `apps/api`):

```bash
bun run --cwd apps/api db:generate   # diff schema vs snapshot, write SQL into apps/api/drizzle/
bun run --cwd apps/api db:migrate    # apply pending migrations
bun run --cwd apps/api db:studio     # browse the local DB
```

`db:push` exists for fast local iteration **only**. Never run it against any database another person or environment relies on — schema changes reach shared environments exclusively through committed migrations (see Database).

## Architecture

### Monorepo layout

```
apps/api/        — backend (Bun runtime + Elysia)
apps/web/        — frontend (React 19 + Vite + Tailwind)
packages/shared/ — Zod schemas + shared types (the API contract; consumed by both sides)
packages/db/     — (optional) extracted schema/migrations if shared beyond the API
e2e/             — Playwright suite
```

### API module structure (`apps/api/src/modules/<name>/`)

Every domain module follows the same layered pattern. This separation is non-negotiable — it is what keeps business logic testable and data access reusable.

| File              | Responsibility                                                                          |
| ----------------- | --------------------------------------------------------------------------------------- |
| `*.routes.ts`     | HTTP routes, request validation, error→status mapping. No business logic.               |
| `*.service.ts`    | Business logic, orchestration, and **transactions** (`db.transaction`). Imports `db`.   |
| `*.repository.ts` | Pure Drizzle queries. Each function takes an `Executor` (`db \| tx`) as its first arg.   |
| `*.types.ts`      | TypeScript types (DB row inferences, service/repository contracts, view models).        |
| `*.errors.ts`     | Typed domain errors (a `DomainError` subclass) + a `…ErrorToHttpStatus` mapper.         |

Request/response **schemas live in `packages/shared/src/*.schema.ts`**, not co-located with modules, so the same definitions are reused by the web client and rendered into the OpenAPI spec. Register them in `z.globalRegistry` so cross-schema references render as `$ref`s.

**Layering rules (enforce in review):**

- Repositories are pure data access: `executor: Executor` first arg, no `db.transaction()`, no business validation, no error mapping. They return rows/DTOs.
- Services are the **only** layer that imports `db` and the **only** layer that calls `db.transaction(...)`. Inside a transaction they pass `tx` to repositories; outside, `db`. Services own all branching, validation, status-history writes, and translation of low-level errors (e.g. Postgres unique-violation) into typed domain errors.
- Routes catch domain errors and map them to HTTP status — nothing more.

**Size heuristics (a smell, not a hard limit):** services/handlers ~200–300 lines; anything multi-table belongs in a transaction. Split before a file becomes a change-magnet.

### REST conventions

- Collections are plural nouns (`/rides`, `/bookings`). Creation is `POST /<collection>` → `201`.
- **State-machine transitions are `PATCH /<collection>/:id/<action>`** (e.g. `PATCH /bookings/:id/{cancel,confirm,reject}`). Re-issuing a transition is a no-op / domain error. Never use `POST /:id/<action>` for a transition.
- `POST` on a non-collection path is reserved for **complex-body reads** that don't fit in query params and don't mutate state. Keep these rare and clearly read-only.
- Every list endpoint is paginated (keyset/cursor preferred over offset). No unbounded collections.
- Validate every request and response against a shared Zod schema. The OpenAPI spec is generated from these schemas — it is not hand-written and not allowed to drift (CI gate).

### Authentication and authorization

Use a **vetted auth library** (here: better-auth + Drizzle adapter) — never roll your own session/password handling.

- Compose authorization as small guards/macros: `isAuthenticated` → `isFullyOnboarded` → `requireAdmin`, each building on the previous.
- Guards **throw typed `AuthError`** — never `return status(...)` inline. A single `.onError` translates domain/auth/validation errors to HTTP responses in one place.
- **Roles are data, not user-settable.** The role column is `input: false` at the auth layer and filtered out of all admin-mutable surfaces. Privilege escalation must be closed *by design* (no endpoint can set a role); promotion is a deliberate, audited operation.
- **Authorize on every request against the live row**, not the (possibly stale) session — a token can predate a ban/suspension. Memoize the session+authz resolution per request (`WeakMap<Request, …>`) so stacked guards cost one DB round-trip, not four.
- **Production auth must include:** verified email, optional MFA, account lockout / throttling on credential endpoints, session revocation, and an audit trail of privilege and status changes.

### Request hardening

Cross-cutting checks run in a root `.onRequest` before any handler:

- **Body-size limit** → `413` for oversized `Content-Length`.
- **Rate limiting** → global default + stricter per-route caps → `429` with `Retry-After`. Read client IP at a `TRUSTED_PROXY_COUNT` offset from the end of `x-forwarded-for` so a client can't escape its bucket by prefilling the header.

> **PRODUCTION REQUIREMENT (elevated from the prototype shortcut):** rate-limit and any realtime fan-out state **must be backed by a shared store (Redis), not process memory.** In-memory counters are exact on one instance and meaningless across replicas. Promote all such limits/windows to env-configurable values so ops can tune without a redeploy.

Throw a typed `RequestError`, caught by the root `.onError`.

### Observability

> **PRODUCTION REQUIREMENT — this is a first-class concern, not an afterthought.**

- **Structured logging** (pino): JSON in prod, pretty in dev, level via `LOG_LEVEL`. Mint a `requestId` per request, echo it as `x-request-id`, and emit exactly one `request` line per request (`{ requestId, method, path, status, durationMs }`). **Redact** Authorization/Cookie/Set-Cookie headers and `*.password`/`*.token`/PII fields before serialization — never disable redaction.
- **Log shipping:** logs go to a central aggregator (not just stdout on a box). Every 5xx logs the full error + stack tied to its `requestId`. Expected 4xx domain errors are NOT logged as errors.
- **Error tracking:** wire an error-reporting service (e.g. Sentry) on both API and web, with releases/source maps so stack traces are readable.
- **Metrics + tracing:** expose request rate / latency / error-rate metrics and propagate trace context (OpenTelemetry) across API → DB → external calls. Define SLOs and alert on them.
- **Health & readiness:** `/health` (liveness) and a readiness probe that checks DB/broker connectivity, for the orchestrator's rollout/rollback decisions.

### Database

Schema with Drizzle ORM. Key rules:

- **Migrations are the only path to shared environments.** Schema changes go through `db:generate`; the committed SQL in `apps/api/drizzle/` is the audit trail. A CI `migration-drift` job fails if schema and migrations diverge.
- **Migration safety in production:** no destructive change (drop column/table, narrowing type, non-concurrent index on a big table) without an explicit expand→migrate→contract plan and a rollback. Migrations run as a gated CI/CD step *before* the new code, and must be backward-compatible with the still-running old version.
- **Timestamps:** `timestamp(6) with time zone` everywhere via a `timestamptz(name)` helper. Never bare `timestamp` — it's naive and breaks ordering across writers.
- **`updatedAt` is auto-bumped by a DB trigger.** App code must NOT pass `updatedAt: new Date()` in `.set(...)` — the trigger owns it.
- **Soft deletes** via `deletedAt`, filtered with `isNull(...)`. Uniqueness-sensitive columns use **partial unique indexes scoped to `WHERE deleted_at IS NULL`** so a soft-deleted row never reserves a key.
- **Status-history tables** give a full audit trail of every status transition — always insert a history row when changing status.
- UUID PKs (`gen_random_uuid()`). All multi-table writes wrapped in a service-owned `db.transaction()`.
- **Operational:** managed Postgres with automated backups + tested restores, connection pooling sized to instance count, and a documented retention/deletion policy for PII.

### Zod usage

Zod v4. Use `z.uuid()`, `z.url()`, `z.email()` directly. Input schemas use `z.coerce.date()` for HTTP date fields. Schemas are the single source of truth shared between client, server validation, and OpenAPI.

### Frontend (`apps/web/`)

- React 19 + Vite + Tailwind. **TanStack Router** (file-based; `-`-prefixed folders are route-private). Don't hand-edit the generated route tree.
- **Data layer:** generated TanStack Query hooks (Orval) from the OpenAPI spec into `src/api-client/`. A custom fetcher injects `credentials: "include"` and throws a typed `ApiError` on non-2xx.
- **Do not use `fetch` directly.** OpenAPI routes go through generated hooks; auth flows go through the auth client. The only raw `fetch` allowed is inside data-layer clients (e.g. a geocoding wrapper) and the fetcher itself.
- **Forms** use react-hook-form + `zodResolver` (reuse the shared schemas). No raw-`useState` form tangles.
- **Errors & loading** are first-class: every query surfaces `isLoading`/`isError`; a router-level error boundary catches the rest.
- **Component library first:** build from the shared UI library; raw interactive HTML (`<button>`, `<input>`) only for genuinely custom primitives, and call those out explicitly.
- **i18n** from day one (no hard-coded user-facing strings); a CI check flags unused keys and locale drift.
- **Accessibility is a requirement:** semantic elements, labels, focus management, keyboard nav, and color-contrast — verified, not assumed.
- **Realtime pattern:** REST is the source of truth; the socket is a delivery channel only. Persist over REST, then broadcast after commit; dedupe pushes by id; reconnect with exponential backoff from a single app-wide connection. Back the fan-out with a broker before scaling to multiple instances.

### Configuration & secrets

- All config is **validated at startup** through a single Zod-parsed `env` module that fails loud on misconfiguration. No `process.env` reads scattered through the code.
- `.env*` is git-ignored except `*.example` templates. **No secret is ever committed.**
- **Production secrets live in a secrets manager** (not a `.env` on a box), are rotated, and are injected at deploy time. Document which env vars are required per environment.

### CI/CD

Every job runs on every MR/push and **all must pass before merge**:

- `lint`, `format`, `typecheck`
- `test` — unit + integration against a throwaway Postgres service container
- **`e2e` — Playwright, a required gate** (at minimum pre-deploy / nightly; not optional)
- `build` — Turbo build of all apps
- `migration-drift` — re-runs `db:generate`, fails if `drizzle/` is out of sync
- `i18n-check` — unused keys + locale drift
- **Security gates:** dependency/SCA scan and SAST; fail on known-high vulnerabilities.

**Deploy** is automated and reversible: migrations gated ahead of the rollout, immutable build artifacts, health/readiness-driven rollout (blue-green or canary), one-command rollback, and a runbook for the on-call.

### Security & privacy

- Parameterized queries only (Drizzle) — never string-built SQL.
- CORS is an explicit allowlist from env, never a wildcard. Set strict security headers (CSP, HSTS, `X-Content-Type-Options`, frame-ancestors).
- Audit-log sensitive actions (auth, role/status changes, data exports).
- Treat PII deliberately: minimize, encrypt in transit (and at rest where required), honor deletion/export (GDPR), and document retention.
- Threat-model new surfaces; add a `/security-review` pass to any change touching auth, payments, file upload, or PII.

---

**The bar:** correctness and clarity over cleverness. Match the surrounding code's idioms. When a "local-only" shortcut and a production path both exist, the production path is the default and any shortcut is explicitly labelled as such. If a change weakens observability, migration safety, or authz, it is not done — it is a regression.
