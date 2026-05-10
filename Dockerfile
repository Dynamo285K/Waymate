# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.13-slim AS base

WORKDIR /app

COPY package.json bun.lock ./

COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/db/package.json ./packages/db/package.json

RUN --mount=type=secret,id=_npmrc,dst=/app/.npmrc \
    bun install --frozen-lockfile

COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "apps/api/src/index.ts"]
