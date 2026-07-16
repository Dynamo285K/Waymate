import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { existsSync } from "fs";

// Vitest runs component/hook tests against jsdom. CSS is skipped — these tests
// assert behaviour, not styling — and the generated API client is excluded
// (it carries no logic worth testing).

// In CI @waymate/ui is not installed — alias it to a stub so Vite doesn't
// error on import resolution. Locally the package is present and we skip the
// alias so the real module is used.
const waymateUiAlias: Record<string, string> = existsSync(
    path.resolve(__dirname, "node_modules/@waymate/ui")
)
    ? {}
    : { "@waymate/ui": path.resolve(__dirname, "src/waymate-ui-mock.ts") };

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { "@": path.resolve(__dirname, "src"), ...waymateUiAlias },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        css: false,
        include: ["src/**/*.test.{ts,tsx}"],
        exclude: ["src/api-client/**", "node_modules/**", "dist/**"],
    },
});
