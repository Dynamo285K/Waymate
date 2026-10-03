#!/bin/sh
# Build and push the e2e CI image for the Bun/Playwright versions in the repo.
# Usage: ci/build-image.sh  (after `docker login gitlab.fi.muni.cz:5050`)
#
# ponytail: built by hand for the single arm64 runner. Automate the build
# (Docker-in-Docker) and go multi-arch together with building the API image in CI.
set -eu
cd "$(dirname "$0")/.."
# shellcheck source=ci/versions.sh
. ci/versions.sh

# The build time makes every rebuild a new, immutable tag. Runners cache images
# by tag (pull_policy if-not-present), so reusing a tag would never reach them.
image="gitlab.fi.muni.cz:5050/xcvejn2/splujazda-sketch/ci:$CI_IMAGE_TAG-$(date -u +%Y%m%d%H%M)"
docker buildx build --platform linux/arm64 \
    --build-arg BUN_VERSION="$BUN_VERSION" \
    --build-arg PLAYWRIGHT_VERSION="$PW_VERSION" \
    -t "$image" --push ci/
echo "Pushed $image"
echo "Now set in .gitlab-ci.yml:  CI_IMAGE: \"$image\""
