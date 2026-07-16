# Waymate

Waymate is a student project organized as a monorepo.
The repository uses **Bun workspaces** together with **Turborepo** to manage multiple applications and shared packages in a single codebase. This setup provides a clean project structure and allows development, build, and type-check tasks to be run consistently from the repository root.

## Overview

This repository is currently prepared as the technical foundation for the project.  
The monorepo structure has already been initialized and verified.
The actual implementation of the frontend, backend, database layer, and shared packages will be added incrementally as project functionality is developed.

## Tech Stack

- **Bun** — package manager and runtime
- **Turborepo** — monorepo task orchestration
- **TypeScript** — shared language across the codebase

Current / planned application stack:

- **React** — frontend
- **Vite** — frontend tooling and dev server
- **Tailwind CSS** — frontend styling
- **Elysia** — backend API
- **Drizzle ORM** — database access layer

## Repository Structure

    apps/
      web/              # frontend application
      api/              # backend application
    packages/
      db/               # database layer
      shared/           # shared types and utilities
    documentation/      # project documentation
    ui-design/          # UI/UX design assets
    package.json        # root workspace configuration
    turbo.json          # Turborepo task configuration
    tsconfig.base.json  # shared TypeScript configuration
    README.md
    .gitignore
    bun.lock

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd waymate
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up the database

The API talks to a local PostgreSQL running in Docker. You need:

- **Docker** with Compose v2 — install [Docker Desktop](https://docs.docker.com/get-docker/)
  (macOS / Windows) or Docker Engine + the compose plugin (Linux). Verify with
  `docker compose version`.
- The Docker daemon must be running before you continue.

Then from the repo root run:

```bash
bun run db:setup
```

The script (`scripts/db-setup.sh`) will:

1. Check that Docker is installed and running.
2. Create `apps/api/.env` from `apps/api/.env.example` if it doesn't exist yet.
3. Start the `db` service via `docker compose up -d`.
4. Wait until Postgres is accepting connections.

After it finishes, the database is reachable at
`postgres://postgres:postgres@localhost:5432/spolujazda_db`. The data is
persisted in the `postgres_data` Docker volume — re-running the script is
safe and will not wipe existing data. Stop the database with
`docker compose down` (add `-v` only if you intentionally want to drop the
volume).

If you need Google OAuth locally, also fill `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` in `apps/api/.env`.

> **Note:** the default `postgres:postgres` credentials in `docker-compose.yml`
> and `.env.example` are for local development only — never reuse them in any
> shared or production environment.

The API enables CORS for `WEB_ORIGIN`. To allow additional hosts (e.g. a
production web origin different from the dev one), set `CORS_ORIGINS` in
`apps/api/.env` as a comma-separated list of full URLs.

### 4. Apply migrations and seed development data

The database container is empty after step 4 — schema and fixtures are
applied separately. For a fresh local database run these two commands in
the order shown:

```bash
bun run --cwd apps/api db:migrate    # creates the tables
bun run --cwd apps/api seed          # fills users, cars, rides, bookings
```

The `seed` script truncates its own tables before inserting, so re-running is safe.

`seed` prints the dev logins on the last lines:

```
Seeding finished. Dev logins:
  admin:  admin@example.com / admin1234
  driver: driver.albert@example.com / driver1234
```

The `driver` account (Albert Olbert) is also seeded with cars, rides, and
bookings so passenger/driver flows have something to load against.

It also seeds 100 regular users (`user.1@example.com` … `user.100@example.com`,
no password — they exist as fixtures for paginating/searching the admin user
list).

#### Resetting and wiping the database

If you ever want to completely wipe and reset the local database (e.g., to clear a broken migration state, remove stale tables, or apply drastic structural changes), you can use the built-in reset command:

```bash
bun run --cwd apps/api db:reset
```

This script will safely drop the `public` schema and the `drizzle` migration history schema, effectively returning your database to an empty slate. It will then automatically run `db:migrate` and `seed` to reconstruct the entire state from scratch based on your current SQL migrations.

### 5. Run backend tests

Backend tests live under `apps/api/src/**/*.test.ts` and run with Vitest:

```bash
bun run test
```

That root shortcut runs the API test suite. The equivalent package-scoped
command is:

```bash
bun run --cwd apps/api test:run
```

They use a separate Postgres database from `apps/api/.env.test`
(`spolujazda_test` by default; copy `apps/api/.env.test.example` if you do
not have one yet). The test global setup creates the database if needed,
applies Drizzle migrations, and then every test starts from a clean schema via
`TRUNCATE ... CASCADE`.

The suite contains two backend layers:

- Service integration tests call service functions directly and verify
  business rules, transactions, status history, and database constraints.
- API route tests call the exported Elysia `app.handle(...)` without starting
  a server. They cover public request/response behavior such as `GET /health`,
  `GET /cities`, and public ride search validation. Authenticated route flows
  are intentionally left to targeted auth/e2e coverage.

### 6. Run end-to-end tests

E2E tests live in `e2e/tests` and run with Playwright:

```bash
bun run test:e2e
```

On a fresh machine install the Playwright Chromium binary first:

```bash
bun run --cwd e2e install:browsers
```

The e2e runner starts its own API and web dev servers on separate ports
(`3010` and `5174` by default), recreates `spolujazda_e2e_db`, applies
migrations, then runs `seed:cities` and `seed`. The local Postgres Docker
service still has to be running; `bun run db:setup` from step 4 is enough.

### 7. Run the project

```bash
bun run dev
```

### 8. Reviewer / Evaluator Access (Logging in)

Since email delivery via Resend requires active API keys which are not provided in the repository, you will not be able to sign up or log in via the magic link flow as a new user.

Instead, please log in using one of the pre-seeded development accounts created in step 5. You can use these credentials in the login form:

- **Admin Account:** `admin@example.com` / `admin1234`
- **Driver Account:** `driver.albert@example.com` / `driver1234` (Pre-seeded with cars, rides, and bookings)
- **Passenger Account:** `passenger.cyril@example.com` / `passenger1234`

### 9. GitLab CI/CD Pipeline (Local Runner)

The project pipeline (`.gitlab-ci.yml`) is configured to run verification jobs exclusively on runners tagged with `local-pc`. This creates a distributed pool of runners from developer machines, significantly speeding up the CI process compared to using shared university servers.

To ensure your pipelines run when you push code, please set up a GitLab Runner on your local machine:

1. Install `gitlab-runner` on your machine (e.g., `brew install gitlab-runner` on macOS).
2. Go to the project in GitLab -> **Settings** -> **CI/CD** -> **Runners**.
3. Click **Create project runner**, set the tag to `local-pc`, and click **Create runner**.
4. Copy the generated token (`glrt-...`) and run the registration command in your terminal:
    ```bash
    gitlab-runner register \
      --non-interactive \
      --url "https://gitlab.fi.muni.cz/" \
      --token "<YOUR_TOKEN>" \
      --executor "docker" \
      --docker-image "oven/bun:1.3.10"
    ```
5. **Enable parallel execution (Highly Recommended):** By default, local runners only process 1 job at a time. To run checks (`lint`, `typecheck`, etc.) simultaneously, edit your runner config:
    - Open `~/.gitlab-runner/config.toml`
    - Change the first line to `concurrent = 4` (or however many cores you want to allocate)
    - Restart the runner (`brew services restart gitlab-runner` or `gitlab-runner restart`)
6. Ensure your Docker daemon and runner service are active. Your machine will now automatically pick up CI jobs whenever it is online.
