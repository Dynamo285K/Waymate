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

### 2. Install dependencies

```bash
bun install
```

### 3. Set up the UI component library

This project uses `waymate-ui` — a shared component library in a separate repository.

Clone it next to this repository:

```bash
cd ..
git clone https://gitlab.fi.muni.cz/xbartel/waymate-ui
cd waymate-ui
bun install
bun run build
bun link
cd ../waymate
bun link waymate-ui
```

> Both repositories must be cloned into the same parent directory.

### 4. Run the project

```bash
bun run dev
```

## UI Library

Source repository: https://gitlab.fi.muni.cz/xbartel/waymate-ui

Components are imported directly:

```tsx
import { Button } from "waymate-ui";
```

Styles are loaded automatically via `apps/web/src/main.tsx`.
