# Waymate

Waymate is a student project organized as a monorepo.
The repository uses **Bun workspaces** together with **Turborepo** to manage multiple applications and shared packages in a single codebase. This setup provides a clean project structure and allows development, build, and type-check tasks to be run consistently from the repository root.

## Overview

This repository is currently prepared as the technical foundation for the project.  
The monorepo structure has already been initialized and verified.
The actual implementation of the frontend, backend, database layer, and shared UI library will be added incrementally as project functionality is developed.

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
- **Custom UI component library** — shared UI components in a separate repository `waymate-ui`

## Repository Structure

    apps/
      web/              # frontend application
      api/              # backend application
    packages/
      ui/               # custom UI component library
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

### 2. Authenticate to the GitLab Package Registry

`@waymate/ui` is published to the GitLab Package Registry of the
[`waymate-ui`](https://gitlab.fi.muni.cz/xbartel/waymate-ui) project. The
project's `.npmrc` reads the auth token from the `CI_JOB_TOKEN` environment
variable. CI sets this automatically; locally you need to provide it yourself
through a GitLab Personal Access Token.

1. Open <https://gitlab.fi.muni.cz/-/user_settings/personal_access_tokens>.
2. Create a token with the scope you need:
    - **`read_api`** — enough to install the package (most contributors).
    - **`api`** — required only if you also intend to publish new versions of
      `@waymate/ui` to the registry.

    Copy the value — GitLab shows it only once.

3. Export it as `CI_JOB_TOKEN` so Bun can substitute it into `.npmrc` at
   install time. The exact command depends on your shell / OS — pick the
   matching row, replace `<token>`, and run it once. After that, **open a new
   terminal** so the variable is loaded.

    | Shell / OS   | Command                                                 |
    | ------------ | ------------------------------------------------------- |
    | Linux + bash | `echo 'export CI_JOB_TOKEN=<token>' >> ~/.bashrc`       |
    | Linux + zsh  | `echo 'export CI_JOB_TOKEN=<token>' >> ~/.zshrc`        |
    | macOS + bash | `echo 'export CI_JOB_TOKEN=<token>' >> ~/.bash_profile` |
    | macOS + zsh  | `echo 'export CI_JOB_TOKEN=<token>' >> ~/.zshrc`        |
    | Windows CMD  | `setx CI_JOB_TOKEN <token>`                             |

    If you use [direnv](https://direnv.net/), you can instead drop
    `export CI_JOB_TOKEN=<token>` into a `.envrc` outside the repo (or into a
    git-ignored one) and `direnv allow` it.

    Do **not** commit the token, and do **not** put it into the project `.npmrc`
    — that file uses `${CI_JOB_TOKEN}` on purpose so each developer (and CI)
    provides their own value.

#### Alternative: write the token into `~/.npmrc`

If you'd rather not manage a shell env var, you can put the token directly
into your **user-level** `~/.npmrc` (not the project one):

```
//gitlab.fi.muni.cz/api/v4/projects/48090/packages/npm/:_authToken=<token>
```

Bun reads `~/.npmrc` in addition to the project `.npmrc`, and the user-level
entry takes precedence over the `${CI_JOB_TOKEN}` placeholder, so
`bun install` will work without `CI_JOB_TOKEN` being set. The trade-off is
that the token sits on disk in plaintext — keep `~/.npmrc` `chmod 600` and
remember to rotate it if your machine is shared.

### 3. Install dependencies

```bash
bun install
```

### 4. Set up the database

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

### 5. Apply migrations and seed development data

The database container is empty after step 4 — schema and fixtures are
applied separately. For a fresh local database run all three commands in
the order shown (it matters now):

```bash
bun run --cwd apps/api db:migrate    # creates the tables
bun run --cwd apps/api seed:cities   # fills the cities reference table (SK + CZ)
bun run --cwd apps/api seed          # fills users, cars, rides, bookings
```

`seed:cities` **must run before `seed`** — fixture ride stops now
reference `cities(id)` via FK, so `seed` looks each city up by name at
insert time and aborts with a clear message if the row is missing.

Both seeds truncate their own tables before inserting, so re-running is
safe. `seed:cities` also truncates `rides` (and CASCADEs through
`ride_stops`, `prices`, `bookings`, and their status history) so the
ride graph stays consistent — always follow `seed:cities` with `seed`
to repopulate the ride fixtures.

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

`seed:cities` downloads GeoNames country dumps for SK and CZ on first run
(cached in `apps/api/.geonames-cache/`, gitignored) and inserts ~16 k
populated places. City data © GeoNames (CC BY 4.0).

#### Resetting after a manual schema wipe

If you ever drop the `public` schema (e.g. `DROP SCHEMA public CASCADE` to
clear a broken state), the three commands above are the full recipe to get
back to a working app — `db:migrate` rebuilds the schema, then `seed:cities`
fills the city catalog, then `seed` fills the rest. Running them out of
order or skipping one causes predictable failures: skipping `seed:cities`
makes `seed` abort with "Fixture city not found in DB"; skipping `seed`
means you cannot log in (the `admin@example.com` / `driver.albert`
accounts no longer exist).

### 6. Run the project

```bash
bun run dev
```

## UI Library

Source repository: <https://gitlab.fi.muni.cz/xbartel/waymate-ui>

`@waymate/ui` contains **reusable primitives only** (Button, Avatar, Modal, DatePicker, icons, …). App-specific components (navbars, ride cards, OfferRideForm, …) live in `apps/web/src/components/` and are imported by relative path.

Reusable primitives:

```tsx
import { Button, Avatar, Modal } from "@waymate/ui";
```

App-specific components:

```tsx
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { RideCard } from "../components/RideCard";
import { OfferRideForm } from "../components/OfferRideForm";
```

Styles are loaded automatically via `apps/web/src/index.css`.
