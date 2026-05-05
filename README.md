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
2. Create a token with scope **`read_api`** (read-only access to the registry
   is enough). Copy the value — GitLab shows it only once.
3. Export it as `CI_JOB_TOKEN` so Bun can substitute it into `.npmrc` at
   install time. The exact command depends on your shell / OS — pick the
   matching row, replace `<token>`, and run it once. After that, **open a new
   terminal** so the variable is loaded.

    | Shell / OS   | Command                                                 |
    | ------------ | ------------------------------------------------------- |
    | Linux + bash | `echo 'export CI_JOB_TOKEN=<token>' >> ~/.bashrc`       |
    | macOS + bash | `echo 'export CI_JOB_TOKEN=<token>' >> ~/.bash_profile` |
    | Windows CMD  | `setx CI_JOB_TOKEN <token>`                             |

    Do **not** commit the token, and do **not** put it into the project `.npmrc`
    — that file uses `${CI_JOB_TOKEN}` on purpose so each developer (and CI)
    provides their own value.

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

### 5. Apply migrations and seed development data

The database container is empty after step 4 — schema and fixtures are
applied separately:

```bash
bun run --cwd apps/api db:migrate    # creates the tables
bun run --cwd apps/api seed          # fills users, cars, rides, bookings
```

The seed **truncates everything first**, so re-running it wipes any local
state (sessions, registrations, rides). It prints the dev admin login on
the last line:

```
Seeding finished. Admin login: admin@example.com / admin1234
```

It also seeds 100 regular users (`user.1@example.com` … `user.100@example.com`,
no password — they exist as fixtures for paginating/searching the admin user
list).

### 6. Run the project

```bash
bun run dev
```

## UI Library

Source repository: <https://gitlab.fi.muni.cz/xbartel/waymate-ui>

Components are imported directly:

```tsx
import { Button } from "@waymate/ui";
```

Styles are loaded automatically via `apps/web/src/main.tsx`.
