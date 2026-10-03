#!/bin/sh
# Wait until every endpoint reports $CI_COMMIT_SHA in its JSON "commit" field.
# Render and Cloudflare keep serving the previous version when a deploy fails,
# so an accepted deploy hook alone proves nothing.
#
# Usage: wait-for-deploy.sh NAME=URL [NAME=URL ...]
set -u

: "${CI_COMMIT_SHA:?CI_COMMIT_SHA is required}"
timeout="${DEPLOY_VERIFY_TIMEOUT_SECONDS:-600}"
interval="${DEPLOY_VERIFY_INTERVAL_SECONDS:-10}"
deadline=$(($(date +%s) + timeout))
failed=0

for target in "$@"; do
    name="${target%%=*}"
    url="${target#*=}"
    while :; do
        # A non-JSON reply (the SPA fallback page) or an unreachable or
        # cold-starting service counts as "not deployed yet".
        running="$(curl -fsS --max-time 30 -H "Cache-Control: no-cache" "$url?t=$(date +%s)" 2>/dev/null |
            jq -r '.commit // empty' 2>/dev/null || true)"
        if [ "$running" = "$CI_COMMIT_SHA" ]; then
            echo "$name is live on $CI_COMMIT_SHA"
            break
        fi
        if [ "$(date +%s)" -ge "$deadline" ]; then
            echo "$name did not deploy $CI_COMMIT_SHA within ${timeout}s (running: ${running:-unknown})" >&2
            failed=1
            break
        fi
        echo "Waiting for $name: running ${running:-unknown}, expected $CI_COMMIT_SHA"
        sleep "$interval"
    done
done

exit "$failed"
