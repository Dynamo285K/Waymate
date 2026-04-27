#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m  %s\n' "$*"; }
err() { printf '\033[1;31mxx\033[0m  %s\n' "$*" >&2; }

if ! command -v docker >/dev/null 2>&1; then
    err "Docker is not installed. Install it from https://docs.docker.com/get-docker/ and re-run this script."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    err "Docker Compose v2 is not available (\`docker compose\`). Update Docker Desktop or install the compose plugin."
    exit 1
fi

DOCKER_INFO_ERR="$(docker info 2>&1 >/dev/null || true)"
if [ -n "$DOCKER_INFO_ERR" ]; then
    if echo "$DOCKER_INFO_ERR" | grep -qi "permission denied"; then
        err "Docker daemon is running but your user can't access /var/run/docker.sock."
        err "Add yourself to the 'docker' group, then log out / back in (or run \`newgrp docker\`):"
        err "    sudo usermod -aG docker \$USER"
        exit 1
    fi
    if echo "$DOCKER_INFO_ERR" | grep -qiE "cannot connect|is the docker daemon running"; then
        err "Docker daemon is not running. Start Docker Desktop (or \`sudo systemctl start docker\`) and re-run this script."
        exit 1
    fi
    err "Docker is not usable: $DOCKER_INFO_ERR"
    exit 1
fi

API_ENV="apps/api/.env"
API_ENV_EXAMPLE="apps/api/.env.example"

if [ ! -f "$API_ENV" ]; then
    log "Creating $API_ENV from $API_ENV_EXAMPLE"
    cp "$API_ENV_EXAMPLE" "$API_ENV"
else
    log "$API_ENV already exists — leaving it untouched"
fi

log "Starting Postgres via docker compose"
docker compose up -d

log "Waiting for Postgres to accept connections"
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose exec -T db pg_isready -U postgres -d spolujazda_db >/dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
        err "Postgres did not become ready within $MAX_ATTEMPTS seconds. Check \`docker compose logs db\`."
        exit 1
    fi
    sleep 1
done

log "Database is ready at postgres://postgres:postgres@localhost:5432/spolujazda_db"
log "Setup complete. Next: \`bun install\` (if you haven't yet) and \`bun run dev\`."
