FROM oven/bun:1 AS base
WORKDIR /app

COPY . .


RUN bun install

#ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000


CMD ["bun", "run", "apps/api/src/index.ts"]