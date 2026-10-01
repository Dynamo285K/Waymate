# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.13-slim AS build

WORKDIR /app

COPY package.json bun.lock ./

COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY e2e/package.json ./e2e/

RUN bun install --frozen-lockfile

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN bun run --cwd apps/api build

FROM oven/bun:1.3.13-slim

WORKDIR /app

ENV NODE_ENV=production

ENV PORT=3000

COPY --from=build /app/apps/api/dist/index.js ./index.js

USER bun

EXPOSE 3000

CMD ["bun", "index.js"]
