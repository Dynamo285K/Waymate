import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest runs component/hook tests against jsdom. CSS is skipped — these tests
// assert behaviour, not styling — and the generated API client is excluded
// (it carries no logic worth testing).
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        css: false,
        include: ["src/**/*.test.{ts,tsx}"],
        exclude: ["src/api-client/**", "node_modules/**", "dist/**"],
    },
});
