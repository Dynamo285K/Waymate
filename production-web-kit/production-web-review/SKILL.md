# Production Web App Review Skill

A two-phase, evidence-based review of a **production** full-stack web application. Derived from the patterns that the Waymate review validated as professional-quality, with the bar raised from "student project" to "real users depend on this, it runs on more than one instance, and it has to be operated."

Invoke **only when explicitly triggered** via `/production-web-review`. Output is written to `REVIEW.md`.

## What's different from a student-project review

A student review asks *"is the pattern present and sound?"* A production review additionally asks *"does it survive a second instance, a bad deploy, a hostile user, and 3am on-call?"* Concretely:

- In-memory rate limits / realtime fan-out are an **❌ Issue** unless backed by a shared store (or the app is provably single-instance by design).
- Tests existing is not enough — **e2e must be a CI gate**, and coverage of critical flows is checked.
- **Observability, CI/CD, secrets management, accessibility, and data privacy are first-class categories**, not nice-to-haves.
- "It works locally" never counts as evidence. Evidence is code, config, CI definitions, and migration history.

## Phase 1: Project Orientation

Explore before judging. Produce descriptive observations only — no verdicts yet:

- Directory structure (excluding deps/VCS/build output).
- All `package.json` (frameworks, libraries, versions — flag end-of-life majors).
- README + any `CLAUDE.md` / contributing / runbook docs.
- Environment templates (`.env*.example`) and the config-validation module.
- Monorepo/workspace + `turbo.json` / build orchestration.
- **CI/CD definitions** (`.gitlab-ci.yml`, `.github/workflows/`, etc.) and any deploy/infra config (Dockerfile, compose, k8s, terraform).

State the detected stack and architecture patterns, then move to assessment.

## Phase 2: Category Reviews

Each category: run targeted searches, then write **status + evidence-based findings (with file:line citations) + numbered recommendations**. Generic observations are not acceptable.

### 1. Component Library & Design System
Library adoption vs. raw-HTML bypasses. Cite every raw `<button>`/`<input>` in non-test code and judge whether it's a justified custom primitive. Consistency of variants/tokens.

### 2. Styling
Inline-style avoidance (only for genuinely dynamic runtime values), one consistent methodology, no dead CSS.

### 3. Data Loading
Server state through a query library (TanStack Query/SWR) with stable cache keys, not ad-hoc `fetch` in components. Loading/empty/error states present. Pagination on every list.

### 4. Configuration & Secrets
No hardcoded secrets (scan history, not just HEAD). `.env*` git-ignored except templates. **Startup config validation.** Production secrets in a manager, documented per-environment, rotatable. `git log`-level check that no secret was ever committed.

### 5. REST API Design
Resource-oriented plural collections, correct verbs, `201` on create, `PATCH` for state transitions (no `POST /:id/action`), meaningful status codes, no PUT-as-PATCH confusion. Request **and response** validated against shared schemas. OpenAPI generated, not hand-written, and drift-checked.

### 6. Database
Schema soundness, ORM usage, **committed migrations as the only path to shared envs** (+ drift CI). Timezone-aware timestamps, soft deletes with partial unique indexes, status-history/audit tables, no blob columns. **Production ops:** migration safety (expand→contract, backward-compatible, gated), backups + tested restore, pooling, retention policy.

### 7. Backend Design Patterns
Strict controller/service/repository separation. Verify by search: **no transactions in repositories**, repositories take an `Executor` first arg, `db.transaction` only in services. Multi-table flows transactional.

### 8. Auth & Authorization
Vetted library, not roll-your-own. Distinct, composable authz guards that **throw typed errors** mapped centrally. Roles non-user-settable (escalation closed by design). **Authorization checked against the live row, not the cached session.** Production: verified email, MFA option, lockout/throttling, session revocation, audit trail.

### 9. Testing
Unit + integration + **e2e as a required CI gate** (not excluded). Critical-path coverage (auth, money, state machines). No `.skip`/`.only`/`todo` quarantine. Tests run against a real DB in CI. Note absence of load/contract tests where they'd matter.

### 10. Observability & Monitoring
Structured logging with request id + redaction of secrets/PII, shipped to an aggregator. Error tracking (Sentry-class) with source maps. Metrics (rate/latency/errors) + distributed tracing. Health **and** readiness probes. Defined SLOs/alerts. `console.*` only in CLI/build contexts.

### 11. Error Handling
Typed domain errors → correct HTTP status in one place; no inline `return status()` from guards; no silent empty `catch {}`. Frontend error boundaries + per-query error states + user-meaningful messages. 5xx logged with stack + request id; expected 4xx not logged as errors.

### 12. Security
Parameterized queries (no string SQL). CORS allowlist, not wildcard. Security headers (CSP/HSTS/etc.). Request hardening: body-size limit, **shared-store rate limiting**, trusted-proxy-aware client IP. Dependency/SCA + SAST in CI. Audit logging of sensitive actions. Authn/authz on every protected route.

### 13. Forms
Modern form library + schema validation (reusing the API's shared schemas) vs. manual `useState` tangles. Server-error surfacing, disabled-while-submitting, accessible validation messages.

### 14. Frontend Structure
Route/component decomposition (size heuristics: ~250 ideal, >~400 must be composed), data fetching at the right level, logic extracted into hooks, no prop-drilling sprawl. Realtime (if any): REST-as-truth + socket-as-delivery, dedupe-by-id, single app-wide connection with backoff, broker-backed fan-out.

### 15. CI/CD & Deployability *(production-only)*
All quality jobs gate merge. Migrations gated ahead of rollout and backward-compatible. Immutable artifacts, health-driven rollout (blue-green/canary), one-command rollback, on-call runbook. Reproducible builds + pinned lockfile.

### 16. Accessibility *(production-only)*
Semantic HTML, labels, focus management, keyboard navigation, color contrast, reduced-motion. Cite concrete violations (e.g. click handlers on non-interactive elements, missing `aria-*`).

### 17. Data Privacy & Compliance *(production-only)*
PII inventory + minimization, encryption in transit/at rest, deletion/export (GDPR-class) support, retention policy, audit of data access. Third-party data sharing documented.

## Evidence & Severity

Cite file paths / snippets / CI lines for every finding. Severity:

- ✅ **Good** — sound and production-ready.
- ⚠️ **Concerns** — works but carries operational/security risk or known scaling cliff.
- ❌ **Issue** — would bite real users/operators (data loss, escalation, silent failure, can't-scale, can't-roll-back).
- **N/A** — not present/applicable (say why).

Single-instance shortcuts (in-memory limits, in-process pub/sub, e2e not gating, no readiness probe, secrets in `.env`) are ⚠️ at best and ❌ if the app is meant to scale.

## Report Format (`REVIEW.md`)

1. **Orientation** — structure, stack (flag EOL deps), architecture, CI/CD & infra observations.
2. **Summary table** — every category with a status emoji.
3. **Detailed sections** — one per category: status, evidence-based findings (file:line), numbered recommendations.
4. **Production-readiness verdict** — a short closing paragraph: would you put this in front of real users and on-call as-is, and the top 3 things to fix first.

---

**Important:** Executes only via `/production-web-review`. Does not auto-trigger on vague "review" requests.
