import { defineConfig } from "vitest/config";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// @ts-ignore: import.meta is only allowed with specific module settings
const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        // Single fork + serial files so the shared test DB doesn't race.
        // Per-test isolation comes from TRUNCATE in beforeEach (see test/setup.ts);
        // without fileParallelism:false one file's reset would interleave with
        pool: "forks",
        fileParallelism: false,
        maxWorkers: 1,
        globalSetup: [path.resolve(dir, "./test/global-setup.ts")],
        // Order matters: load-env mutates process.env so the later setup
        // (which transitively imports config/env) sees the test values.
        setupFiles: [
            path.resolve(dir, "./test/load-env.ts"),
            path.resolve(dir, "./test/setup.ts"),
        ],
        hookTimeout: 30_000,
        testTimeout: 15_000,
    },
});
