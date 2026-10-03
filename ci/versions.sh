#!/usr/bin/env sh
# Versions baked into the CI image, read from the repo so they cannot drift.
# Sourced from the repo root by ci/build-image.sh and the ci-image-check job.
BUN_VERSION="$(grep -o '"bun@[0-9.]*"' package.json | cut -d@ -f2 | tr -d '"')"
PW_VERSION="$(grep -o '"@playwright/test@[0-9.]*"' bun.lock | head -1 | cut -d@ -f3 | tr -d '"')"
: "${BUN_VERSION:?could not read the Bun version from package.json packageManager}"
: "${PW_VERSION:?could not read the Playwright version from bun.lock}"
CI_IMAGE_TAG="bun${BUN_VERSION}-pw${PW_VERSION}"
