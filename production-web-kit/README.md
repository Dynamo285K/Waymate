# Production Web Kit

A starter pair for **real** full-stack web apps, distilled from the patterns that the Waymate review validated as professional-quality — with the student-project trade-offs raised to a production bar.

Two artifacts that intentionally mirror each other (the skill audits what the CLAUDE.md prescribes):

| File | What it is | Where it goes |
| ---- | ---------- | ------------- |
| `CLAUDE.md` | Project guidance loaded every session — the conventions a new repo should follow. | Repo root of the new project (edit the `<PROJECT>` / `<domain>` placeholders + stack first). |
| `production-web-review/SKILL.md` | A `/production-web-review` skill: a two-phase, evidence-based audit with the bar set for production. | Your skills directory (personal `~/.claude/skills/` or a shared skills repo). |

## How to use them together

1. **Starting a new project:** copy `CLAUDE.md` to the new repo, fill in the placeholders, delete any sections for tech you're not using. It encodes layering, REST/auth conventions, observability, migration safety, CI/CD, and security/privacy from day one.
2. **Auditing an existing project:** install the skill and run `/production-web-review`. It writes a `REVIEW.md` with a status table and file-cited findings across 17 categories.
3. They share one rubric, so the review checks exactly what the guidance asks for — drift in one shows up in the other.

## What was kept from Waymate (the genuinely good)

Layered `routes → service → repository` with an `Executor`-first repository contract and transactions confined to services; schemas-as-contract in a shared package feeding OpenAPI; typed domain errors mapped centrally in `.onError`; composable auth guards with roles non-settable by design and authz checked against the live row; timezone-aware timestamps, trigger-owned `updatedAt`, soft deletes with partial unique indexes, status-history audit tables, migrations as the only path to shared envs; structured logging with request ids + redaction; generated query hooks with no direct `fetch`; react-hook-form + zodResolver; REST-as-truth + socket-as-delivery realtime with dedupe-by-id.

## What was raised for production

- Rate limiting / realtime fan-out **must** be backed by a shared store (Redis), not process memory.
- **e2e is a required CI gate**, not excluded.
- **Observability is first-class:** log shipping, error tracking, metrics, tracing, readiness probes, SLOs.
- **CI/CD & deployability:** gated backward-compatible migrations, health-driven rollout, one-command rollback, runbook; SCA + SAST gates.
- **Secrets** live in a manager and are rotated, not in a `.env` on a box.
- **Accessibility** and **data privacy/compliance** added as explicit categories.
