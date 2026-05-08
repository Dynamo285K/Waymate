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
                "/api/auth": {
                    target: apiTarget,
                    changeOrigin: true,
                    // Auth routes already live under /api/auth on the API.
                    // Keep the public same-origin path identical so OAuth
                    // callback cookies are scoped to the web origin.
                },
                "/api": {
                    target: apiTarget,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ""),
                },
            },
        },
        resolve: {
            dedupe: ["react", "react-dom"],
        },
    };
});
