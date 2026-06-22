import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL } from "./global-setup";

// E2E uses its own DB (`spolujazda_e2e_db` by default — see global-setup.ts)
// and its own API + web ports so it never collides with whatever the
// developer has running on the dev ports.
const API_PORT = Number(process.env.E2E_API_PORT ?? 3010);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5174);
const API_ORIGIN = `http://localhost:${API_PORT}`;
const BASE_URL = `http://localhost:${WEB_PORT}`;
const REUSE_EXISTING_SERVER = process.env.E2E_REUSE_EXISTING_SERVER === "1";

// Env vars forwarded to the API webServer process. Keeping the e2e defaults
// here means start-api.ts can use the same validated env path as the real API
// instead of mutating runtime env itself.
const apiServerEnv: Record<string, string> = {
    NODE_ENV: "test",
    DATABASE_URL: E2E_DATABASE_URL,
    PORT: String(API_PORT),
    BETTER_AUTH_URL: API_ORIGIN,
    WEB_ORIGIN: BASE_URL,
    RESEND_API_KEY: "re_e2e",
    LOG_LEVEL: "silent",
    RATE_LIMIT_ENABLED: "false",
    RIDE_AUTO_END_ENABLED: "false",
};

export default defineConfig({
    testDir: "./tests",
    timeout: 30_000,
    expect: { timeout: 5_000 },
    // E2E tests share a single DB; running them in parallel would race
    // each other's writes. Single worker keeps things deterministic.
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: [
        {
            command: "bun start-api.ts",
            env: apiServerEnv,
            url: `${API_ORIGIN}/health`,
            // Reuse is opt-in. A stale Vite/API process can carry an old proxy
            // target or DB env and make auth tests fail with misleading 500s.
            reuseExistingServer: REUSE_EXISTING_SERVER,
            timeout: 60_000,
            stdout: "pipe",
            stderr: "pipe",
        },
        {
            // Serve a production build via `vite preview` rather than `vite
            // dev`. With autoCodeSplitting each route is its own chunk; under
            // `dev` those compile on-demand on first navigation, so the first
            // visit to each route takes 20-30s cold and blows Playwright's
            // assertion timeouts (flaky, slow). The prebuilt `preview` server
            // has every chunk ready — fast and stable, and it exercises the
            // real production artifact. The build is why this server gets a
            // longer startup timeout than the API.
            command: `bun run --cwd ../apps/web build && bun run --cwd ../apps/web preview --port ${WEB_PORT} --strictPort`,
            url: BASE_URL,
            env: {
                API_PROXY_TARGET: API_ORIGIN,
                VITE_API_PROXY_TARGET: API_ORIGIN,
            },
            reuseExistingServer: REUSE_EXISTING_SERVER,
            timeout: 180_000,
            stdout: "ignore",
            stderr: "pipe",
        },
    ],
});
