import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        fileParallelism: false,
        maxWorkers: 1,
        globalSetup: ["./test/global-setup.ts"],
        setupFiles: ["./test/load-env.ts", "./test/setup.ts"],
        hookTimeout: 30_000,
        testTimeout: 15_000,
        isolate: false,
    },
});
