import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiTarget = (
        env.API_PROXY_TARGET ??
        env.VITE_API_PROXY_TARGET ??
        "http://localhost:3000"
    ).replace(/\/$/, "");

    return {
        plugins: [react(), tailwindcss()],
        server: {
            proxy: {
                "/api": {
                    target: apiTarget,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ""),
                    // Don't override Origin: better-auth's CSRF protection
                    // (`trustedOrigins`) checks it on authenticated mutations
                    // like sign-out. The browser already sends the correct
                    // `Origin: http://localhost:5173`, which matches
                    // WEB_ORIGIN. Forcing it to `apiTarget` makes
                    // /api/auth/sign-out 403 INVALID_ORIGIN, the session
                    // never gets deleted, and the user bounces back to /admin.
                },
            },
        },
        resolve: {
            dedupe: ["react", "react-dom"],
        },
    };
});
