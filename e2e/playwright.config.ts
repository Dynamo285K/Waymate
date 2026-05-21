import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL } from "./global-setup";

// E2E uses its own DB (`spolujazda_e2e_db` by default — see global-setup.ts)
// and its own API + web ports so it never collides with whatever the
// developer has running on the dev ports.
const API_PORT = Number(process.env.E2E_API_PORT ?? 3010);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5174);
const API_ORIGIN = `http://localhost:${API_PORT}`;
const BASE_URL = `http://localhost:${WEB_PORT}`;

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
            // Locally we still allow reuse — but the e2e API runs on a unique
            // port + DB, so "reuse" only ever picks up a stale e2e process,
            // never the developer's dev API.
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            stdout: "pipe",
            stderr: "pipe",
        },
        {
            command: `bun run --cwd ../apps/web dev --port ${WEB_PORT} --strictPort`,
            url: BASE_URL,
            env: {
                API_PROXY_TARGET: API_ORIGIN,
                VITE_API_PROXY_TARGET: API_ORIGIN,
            },
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            stdout: "ignore",
            stderr: "pipe",
        },
    ],
});
