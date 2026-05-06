# Schema audit

Snapshot date: 2026-05-06. Audits `apps/api/src/db/schema/*` against
the invariants documented in `CLAUDE.md` and the conventions implied
by the existing repositories. Findings are grouped by category, then
flagged per table with severity:

- **P1** — invariant violation or correctness risk; fix in this PR.
- **P2** — drift / latent bug that should ship as a follow-up ticket.
- **P3** — consistency / hygiene / documentation; "won't-fix-unless-bored"
  unless we revisit the schema for another reason.

Out of scope (carried over from the ticket): performance benchmarking,
column renames, anything inside the better-auth managed tables
(`accounts`, `sessions`, `verifications`, `rate_limits`).

> **Status (2026-05-06):** every P1 *and* every P2 item below shipped
> in this PR (migration `0003_fast_true_believers.sql`). Findings are
> kept verbatim as the audit trail; see the **Plan** section at the
> end for what actually landed and what's still deferred.

---

## 1. Soft-delete coverage

### 1.1 Which tables have `deletedAt`?

| Table                                         | `deletedAt` | Verdict                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`                                       | yes         | OK — long-lived domain entity                                                                                                                                                                                                                                                                          |
| `cars`                                        | yes         | OK                                                                                                                                                                                                                                                                                                     |
| `rides`                                       | yes         | OK                                                                                                                                                                                                                                                                                                     |
| `bookings`                                    | yes         | OK                                                                                                                                                                                                                                                                                                     |
| `messages`                                    | yes         | OK — user-visible content, retract-without-erase                                                                                                                                                                                                                                                       |
| `conversations`                               | yes         | OK                                                                                                                                                                                                                                                                                                     |
| `blocklist`                                   | yes         | OK                                                                                                                                                                                                                                                                                                     |
| `reviews`                                     | **no**      | **P2** — reviews carry user-visible reputation; today the only way to retract is `reviewStatus = 'HIDDEN' / 'REMOVED'`. That is fine as a moderation tool, but if a _user_ deletes their own review we have nowhere to hide the row. Decide: either keep status-only and document, or add `deletedAt`. |
| `ride_stops`                                  | no          | OK (life-cycle inherited from `rides` — never deleted independently)                                                                                                                                                                                                                                   |
| `prices`                                      | no          | OK (same)                                                                                                                                                                                                                                                                                              |
| `notifications`                               | no          | OK — short-lived audit-ish records, status-driven                                                                                                                                                                                                                                                      |
| `*_status_history`                            | no          | OK — append-only audit log by design                                                                                                                                                                                                                                                                   |
| `car_models`                                  | no          | OK — reference data                                                                                                                                                                                                                                                                                    |
| `accounts/sessions/verifications/rate_limits` | n/a         | better-auth owned, out of scope                                                                                                                                                                                                                                                                        |

### 1.2 Repository lookups vs `isNull(deletedAt)`

Walked every reader in `*.repository.ts`. All recent fixes from the
repo-pattern audit are now in place. Findings:

- **`users.repository.ts`** — **P1**. `findUserById` does **not** filter
  `isNull(usersTable.deletedAt)`. Currently every caller is the active
  user themselves (`isAuthenticated` guarantees a live session, which
  cascades from a live row), so this is latent rather than active. Add
  the filter for defense-in-depth — same justification as the
  `visibleUserConditions` already applied in `admin.repository.ts`. The
  `updateOnboardingInfo` / `updateUserProfile` writers also miss it,
  which means we can in principle bring a soft-deleted user back to
  life by writing through the existing session — fix together.
- **`cars.repository.ts`** — OK. `findCarsByUserId`, `updateCarStatus`,
  `deleteCar` all use `carNotSoftDeleted`. `findAllCarBrandNames` /
  `findCarModelsByBrand` operate on `car_models` which has no
  soft-delete column — correct.
- **`rides.repository.ts`** — OK. After the recent KAN-XXX fix,
  `findRideForCancel` and `updateRideStatusToCancelled` filter the
  ride. `bulkCancelBookings` is FK-anchored on `bookings.id` — passes
  ids that came from the soft-deleted-aware `findActiveBookingsByRideId`,
  which is fine, but the bulk update itself does not re-assert
  `bookingNotSoftDeleted`. **P3** — low risk because the ids were just
  produced inside the same transaction, but cheap to add.
- **`bookings.repository.ts`** — OK across the board.
- **`reviews.repository.ts`** — `findRideContext` filters the ride;
  `wasPassengerOnRide` filters the booking. `findReviewsForSubject` /
  `findReviewsByAuthor` correctly filter on `reviewStatus = 'VISIBLE'`
  rather than soft-delete (no column to filter). OK.
- **`admin.repository.ts`** — uses `visibleUserConditions` everywhere,
  which composes `isNull(deletedAt)` and `userRole != 'ADMIN'`. OK.
  `findUserCreatedAt` deliberately bypasses the filter to anchor the
  cursor; documented in code.
- **`messages` / `conversations` / `blocklist`** — no repository
  exists yet (these tables are unused by the API surface at the
  moment). **P3** — flag the invariant in the table file or in
  CLAUDE.md so the _first_ repository for each table is born with
  the filter, not retrofitted to it.

### 1.3 Partial unique indexes scoped to `WHERE deletedAt IS NULL`

| Index                                        | Today                                                   | Verdict                                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users.email` UNIQUE + `user_email_lower_uq` | full unique, no soft-delete predicate                   | **P1** — soft-deleting a user blocks the same email from ever being reused. Re-issue both as `WHERE deleted_at IS NULL`.                                 |
| `cars_spz_country_code_uq`                   | full unique, no soft-delete predicate                   | **P1** — same problem: deleting a car blocks the same SPZ from ever being re-registered (e.g. user re-adds their car after a mistake). Re-issue partial. |
| `ride_stops_ride_id_stop_order_uq`           | full unique on a non-soft-delete table                  | OK                                                                                                                                                       |
| `prices_ride_start_end_uq`                   | same                                                    | OK                                                                                                                                                       |
| `reviews_ride_author_subject_uq`             | same — but see 1.1 about reviews not having `deletedAt` | OK for now                                                                                                                                               |

Both `P1` partial-unique fixes ship as a single migration: drop +
recreate the index with `WHERE deleted_at IS NULL`. No data migration
needed (the predicate excludes nothing today — there are no
soft-deleted rows in those tables yet). Backwards compatible.

---

## 2. Timestamp consistency

- Better-auth tables (`accounts`, `sessions`, `verifications`) use
  `timestamp("...", { precision: 6, withTimezone: true })`. The Waymate
  tables use bare `timestamp("...")` — **no timezone, no precision**.
- Rationale for the split: better-auth requires `timestamptz`; the
  Drizzle adapter would otherwise silently misformat its values. We
  did _not_ roll the same convention out to our own tables.
- Verdict: **P2**. `timestamptz` is the correct default — Postgres stores
  it as UTC and the discrepancy will eventually bite us when a
  passenger in a different timezone reads `departureAt` and gets a
  naive datetime back. Fix as a one-shot migration that
  `ALTER COLUMN ... TYPE timestamptz USING (...)` for every domain
  timestamp. Backwards-compat: the `USING` cast must explicitly assume
  the local TZ of the writer, so do this _before_ we deploy beyond a
  single server.
- **`updatedAt` honoured on UPDATE?** Walked every `.update(...)` in
  `apps/api/src/modules`:
    - `cars.repository.ts` — yes (both writers).
    - `rides.repository.ts` — yes.
    - `bookings.repository.ts` — yes (the `updateBookingFields` helper
      bumps it for the whole transition surface).
    - `admin.repository.ts` — yes.
    - **`users.repository.ts` — no.** Both `updateOnboardingInfo` and
      `updateUserProfile` `.set(data)` without bumping `updatedAt`. **P1**
      — fix in this PR. Two options:
        1. Add `updatedAt: new Date()` at every UPDATE site (matches the
           rest of the codebase).
        2. Add a Postgres `BEFORE UPDATE` trigger (`SET NEW.updated_at = now()`)
           on every domain table; remove the manual bumps from services.
           More invasive but eliminates the whole class of bug. Worth a
           follow-up ticket — too big for this PR.

---

## 3. Status history pattern

### 3.1 Shape consistency

| Table                    | Columns                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `user_status_history`    | id, userId, oldStatus, newStatus, changedByUserId, reason, createdAt    |
| `ride_status_history`    | id, rideId, oldStatus, newStatus, changedByUserId, reason, createdAt    |
| `booking_status_history` | id, bookingId, oldStatus, newStatus, changedByUserId, reason, createdAt |

Identical shape across all three. OK.

### 3.2 Service-layer discipline (history written for every status change)

Walked every status-mutation site:

| Site                                                              | History row inserted?          |
| ----------------------------------------------------------------- | ------------------------------ |
| `BookingService.createBookingRequest` (`PENDING`)                 | yes                            |
| `BookingService.confirmBooking` (`PENDING → CONFIRMED`)           | yes                            |
| `BookingService.rejectBooking` (`PENDING → REJECTED`)             | yes                            |
| `BookingService.cancelBookingByPassenger` (`* → CANCELLED`)       | yes                            |
| `BookingService.cancelBookingByDriver` (`* → CANCELLED`)          | yes                            |
| `RideService.createRide` (initial `PLANNED`)                      | yes                            |
| `RideService.cancelRide` (`* → CANCELLED`) + bulk-cancel bookings | yes (both ride + each booking) |
| `AdminService.setUserStatus` (`* → newStatus`)                    | yes                            |

No misses today. **OK.**

### 3.3 Schema-level enforcement?

CLAUDE.md is explicit: history is enforced by service-layer
_discipline_, not by the schema. We can't easily enforce it with a
plain CHECK or FK; the only Postgres-native way is a `BEFORE UPDATE`
trigger that compares `OLD.status` vs `NEW.status` and inspects a
session-scoped flag set by the service before the UPDATE.

Verdict: **P3 — won't fix.** The triggers add real complexity (audit
of who-set-the-flag, transaction-local state, harder to reason about
in tests) for a problem we have not actually hit. Revisit if we ever
get caught by a missing history row in production.

---

## 4. Enum consistency

`apps/api/src/db/schema/enums.ts` imports every enum from
`@repo/shared` (`packages/shared/src/status-values.ts`). All Drizzle
`pgEnum` definitions reuse those tuple constants — single source of
truth confirmed.

### 4.1 Inline string literals in queries / writes

We deliberately use string literals in query bodies because Drizzle's
`pgEnum`-typed columns already constrain them at the type level
(TypeScript catches a typo before runtime). However, calling them out
for visibility:

- `booking.repository.ts`, `ride.repository.ts`, `booking.service.ts`,
  `ride.service.ts`, `review.repository.ts`, `auth.middleware.ts`,
  `admin.service.ts` — all use bare string literals
  (`"PENDING"`, `"CONFIRMED"`, `"PLANNED"`, `"VISIBLE"`, `"ADMIN"`,
  `"COMPLETED"`, etc.).
- TypeScript flags any drift because the enum tuple is the source of
  the column type. Confirmed by running `bun run typecheck` (clean).

Verdict: **OK / P3.** The string literals are type-safe today. Only
risk is if someone composes a status string dynamically — none of the
current code does. If we want extra hygiene we can swap to constant
imports (e.g. `BookingStatusValues.Pending`), but it's churn for
churn's sake.

---

## 5. Foreign key actions

Every FK is _explicitly_ declared in `0000_material_blink.sql` — no
"Drizzle defaults silently". Auditing the choices:

| FK                                                                               | Action    | Verdict                                                                                                                                                      |
| -------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `accounts.user_id → users.id`                                                    | CASCADE   | OK — auth-row dies with user                                                                                                                                 |
| `sessions.user_id → users.id`                                                    | CASCADE   | OK — same                                                                                                                                                    |
| `cars.owner_id → users.id`                                                       | NO ACTION | OK — soft-delete model: prevent hard-delete with cars                                                                                                        |
| `cars.model_id → car_models.id`                                                  | NO ACTION | OK — reference data                                                                                                                                          |
| `rides.driver_id → users.id`                                                     | NO ACTION | OK                                                                                                                                                           |
| `rides.car_id → cars.id`                                                         | NO ACTION | OK                                                                                                                                                           |
| `ride_stops.ride_id → rides.id`                                                  | NO ACTION | **P3** — semantically these _are_ owned by the ride. CASCADE would simplify a hypothetical hard-delete admin path. Today we never hard-delete, so no impact. |
| `prices.{ride_id, start_stop_id, end_stop_id}`                                   | NO ACTION | **P3** — same as above (owned by ride)                                                                                                                       |
| `bookings.{passenger_id, ride_id, pickup/dropoff_stop_id, cancelled_by_user_id}` | NO ACTION | OK — every relation should refuse hard-delete because of soft-delete contract                                                                                |
| `reviews.{ride_id, author_id, subject_id}`                                       | NO ACTION | OK                                                                                                                                                           |
| `conversations.{ride_id, booking_id}`                                            | NO ACTION | OK                                                                                                                                                           |
| `messages.{conversation_id, sender_id}`                                          | NO ACTION | OK                                                                                                                                                           |
| `notifications.user_id`                                                          | NO ACTION | **P3** — notifications are user-private; CASCADE would be fine if we ever hard-delete a user. Today we don't, so latent.                                     |
| `*_status_history.*`                                                             | NO ACTION | OK — audit log, must outlive everything                                                                                                                      |
| `blocklist.*`                                                                    | NO ACTION | OK                                                                                                                                                           |

Net: **NO ACTION is the correct default for everything that has a
soft-delete counterpart.** The handful of P3s only matter if/when we
add a real hard-delete admin tool.

---

## 6. Check constraints

### 6.1 Inventory

| Table                        | CHECKs                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `users`                      | rich (email/name/phone/bio length + format)                                   |
| `cars`                       | seats > 0, spz length 2-12, spz `[A-Z0-9]+`                                   |
| `rides`                      | seats > 0, arrival ≥ departure, currency `[A-Z]{3}`, description ≤ 500        |
| `bookings`                   | distinct stops, seats > 0, price ≥ 0, currency `[A-Z]{3}`, cancellation ≤ 500 |
| `prices`                     | amount ≥ 0, distinct stops, currency `[A-Z]{3}`                               |
| `reviews`                    | rating 1-5, author ≠ subject                                                  |
| `ride_stops`                 | order ≥ 0, lat/lng range, address/city length, planned-time order             |
| `car_models`                 | brand/model length 1-100                                                      |
| `*_status_history`           | reason ≤ 500                                                                  |
| `blocklist`                  | no self-block, revokedAt ≥ createdAt, reasonText ≤ 500                        |
| `conversations`              | rideId OR bookingId present                                                   |
| `messages` / `notifications` | **none**                                                                      |

### 6.2 Findings

- **P3** — `messages.content` and `notifications.title/body` have no
  length cap. Today we don't expose endpoints that write to them, so
  it's pre-emptive — but trivial to add (e.g. `body ≤ 2000`,
  `title ≤ 200`). Bundle when we build the messaging feature.
- **OK** — every domain-meaningful invariant currently in scope (seat
  counts, prices, ratings, currency format, stop ordering) is enforced
  at the schema level. Defense-in-depth even if Zod also rejects.

---

## 7. Indexes

### 7.1 Coverage of common access paths

- `*_status_history.{userId|rideId|bookingId}` — indexed.
- `bookings.rideId` — indexed (`bookings_ride_id_idx`); used by the
  capacity-sum subquery in `findAvailableRides` / `searchRides`.
- `ride_stops.ride_id` — covered by the _unique_ composite
  `(ride_id, stop_order)`. Postgres can use the leading column, so a
  separate `ride_stops_ride_id_idx` is redundant. OK.
- `rides.{driverId, carId, departureAt, status, offeredSeats, createdAt}` — all indexed.
- `bookings.{passengerId, rideId, pickup/dropoff_stop_id, status, createdAt}` — indexed.
- `reviews.{subjectId, rating, status, createdAt}` — indexed.
- `users.{email lower, status, createdAt}` — indexed.

### 7.2 Probably unnecessary indexes

- `ride_stops_lat_idx`, `ride_stops_lng_idx` — separate indexes on
  raw lat/lng without a GIST/spatial index don't help any query we
  actually run. **P3** — drop unless we have a planned use case.
- `rides_offered_seats_idx` — we only filter on derived
  `seatsLeft`, never on `offered_seats` directly. **P3** — drop.
- `notifications_read_at_idx` — useful only if we ever do `WHERE read_at IS NULL`
  in production volume; harmless today, leave alone. P3.

These are insert-cost-only; correctness-irrelevant. Defer to a future
"index hygiene" sweep.

---

## 8. Default values

- `cars.isActive` — `default(true)` ✅
- `users.userStatus` — `default("ACTIVE")` ✅
- `users.userRole` — `default("USER")` ✅
- `users.banned` / `emailVerified` — `default(false)` ✅
- `cars.isActive` — `default(true)` ✅
- **`bookings.bookingStatus`** — no default; service sets `"PENDING"`
  in `insertBooking`. **P3** — adding `.default("PENDING")` at the
  schema level would make the contract explicit (and survive a future
  ad-hoc INSERT). Service code already passes it explicitly so the
  default is purely belt-and-braces. Low priority.
- **`rides.rideStatus`** — same story; service sets `"PLANNED"` in
  `createRide`. Same **P3** verdict.
- **`reviews.reviewStatus`** — same. Service sets `"VISIBLE"`.

Migration risk: adding a default is backwards-compatible. No data
update needed.

---

## 9. Schema documentation

Currently _zero_ file-level comments in `apps/api/src/db/schema/*`. The
domain model has subtle decisions — per-segment pricing, 0-indexed
stop order, "stop 0 is origin" — that are worth a single block
comment at the top of `price.ts` and `ride_stop.ts`.

Verdict: **P3** — friendly-to-newcomers doc work, not invariant work.
Bundle into a docs-only PR alongside any other CLAUDE.md tweaks.

---

## Plan: what shipped in this PR

**Landed (P1 + P2), all in migration `0003_fast_true_believers.sql`:**

1. `users.repository.ts` — `findUserById` / `updateOnboardingInfo` /
   `updateUserProfile` now filter `isNull(usersTable.deletedAt)`.
2. Dropped the bare `users_email_unique` constraint; rebuilt
   `user_email_lower_uq` as a partial unique index
   `WHERE deleted_at IS NULL`. Same treatment for
   `cars_spz_country_code_uq` and `reviews_ride_author_subject_uq`.
3. Added `deleted_at` column to `reviews`. Reviews now follow the
   same soft-delete contract as the other user-visible domain tables.
4. Converted every domain timestamp to `timestamp(6) with time zone`
   via the new `timestamptz()` helper in `db/schema/timestamps.ts`.
   Better-auth tables already used this shape; the rest now matches.
5. Added a Postgres `set_updated_at_to_now()` trigger function +
   `BEFORE UPDATE` triggers on every domain table that has an
   `updated_at` column (users, cars, rides, ride_stops, prices,
   bookings, reviews, conversations, messages, notifications,
   blocklist). The service / repository layer no longer passes
   `updatedAt: new Date()` — removed across `cars`, `rides`,
   `bookings`, `admin` repositories. CLAUDE.md updated to document
   the new contract.
6. Added schema-level defaults for `bookings.bookingStatus = 'PENDING'`
   and `reviews.reviewStatus = 'VISIBLE'` (still set explicitly by the
   service, but the schema is no longer silent on the contract).

**Follow-up tickets (deferred — P3):**

- Index hygiene sweep (7.2) — drop `ride_stops_lat_idx` /
  `ride_stops_lng_idx` / `rides_offered_seats_idx` once we confirm no
  query plan relies on them.
- Length CHECKs on `messages.content` / `notifications.title|body`
  (6.2) — bundle with the messaging feature.
- Schema docstrings on `price.ts` / `ride_stop.ts` (9).
- `NO ACTION` → `CASCADE` for `ride_stops.ride_id` / `prices.*`
  (5) — only matters once we add a hard-delete admin path.

**Won't fix:**

- Status-history triggers (3.3) — complexity > benefit; the
  service-layer discipline is currently unbroken.

---

## Acceptance smoke test (after migrations)

Run on 2026-05-06 against a freshly-dropped public schema:

```
docker compose up -d
bun run --cwd apps/api db:migrate
bun run --cwd apps/api seed
```

- Migrations applied cleanly through `0003_fast_true_believers.sql`.
- All 11 `trg_*_set_updated_at` triggers visible in
  `information_schema.triggers`.
- Partial unique indexes for `user_email_lower_uq`,
  `cars_spz_country_code_uq`, `reviews_ride_author_subject_uq` confirmed
  to carry `WHERE (deleted_at IS NULL)`.
- `admin@example.com / admin1234` and
  `driver.albert@example.com / driver1234` both authenticate via
  `POST /api/auth/sign-in/email` (returns session token + user payload).
- Manual `UPDATE users SET first_name='…'` confirmed `updated_at`
  jumps forward without the writer setting it.
