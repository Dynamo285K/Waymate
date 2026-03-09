# Waymate

Waymate is a student project organized as a monorepo.

The repository uses **Bun workspaces** together with **Turborepo** to manage multiple applications and shared packages in a single codebase. This setup provides a clean project structure and allows development, build, and type-check tasks to be run consistently from the repository root.

## Overview

This repository is currently prepared as the technical foundation for the project.  
The monorepo structure has already been initialized and verified.

The actual implementation of the frontend, backend, and database layer will be added incrementally as project functionality is developed.

## Tech Stack

- **Bun** — package manager and runtime
- **Turborepo** — monorepo task orchestration
- **TypeScript** — shared language for the codebase

Planned application stack:

- **React** — frontend
- **Vite** — frontend tooling and dev server
- **Express** — backend API
- **Drizzle ORM** — database access layer

## Repository Structure

    apps/
      web/              # frontend application
      api/              # backend application

    packages/
      db/               # database layer
      shared/           # shared types and utilities

    documentation/      # project documentation
    UI_design/          # UI/UX design assets

    package.json        # root workspace configuration
    turbo.json          # Turborepo task configuration
    tsconfig.base.json  # shared TypeScript configuration
    README.md
    .gitignore
    bun.lock

## Requirements

Before working with this repository, make sure you have the following installed:

- **Git**
- **Bun**
- a code editor such as **VS Code**

## Getting Started

### 1. Clone the repository

    git clone <repository-url>
    cd waymate

### 2. Install dependencies

    bun install
