ARG BUN_VERSION
FROM oven/bun:${BUN_VERSION}

ARG PLAYWRIGHT_VERSION
ARG DEBIAN_FRONTEND=noninteractive
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN bunx playwright@${PLAYWRIGHT_VERSION} install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/* /root/.bun/install/cache
