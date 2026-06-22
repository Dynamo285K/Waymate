import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiTarget = (
        env.API_PROXY_TARGET ??
        env.VITE_API_PROXY_TARGET ??
        "http://localhost:3000"
    ).replace(/\/$/, "");

    // Same proxy rules for `vite dev` (server) and `vite preview`. The e2e
    // suite runs against `vite preview` of the production build so code-split
    // route chunks are prebuilt instead of compiled on-demand; preview uses
    // its own `preview.proxy` and does NOT inherit `server.proxy`.
    const proxy = {
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
            // Proxy WebSocket upgrades too (chat realtime connects to
            // /api/conversations/ws). Without this Vite only forwards
            // plain HTTP and the upgrade handshake never reaches the API.
            ws: true,
            rewrite: (path: string) => path.replace(/^\/api/, ""),
        },
    };

    return {
        plugins: [
            tanstackRouter({ target: "react", autoCodeSplitting: true }),
            react(),
            tailwindcss(),
        ],
        server: {
            // Pinned: the API's Better Auth `trustedOrigins` is built from
            // WEB_ORIGIN (http://localhost:5173). If Vite silently fell back
            // to 5174 because 5173 was taken, the browser Origin would no
            // longer be trusted and every state-changing auth call (sign-in,
            // sign-out) would be rejected. `strictPort` turns that silent
            // drift into a loud "port in use" error instead.
            port: 5173,
            strictPort: true,
            proxy,
        },
        preview: {
            proxy,
        },
        resolve: {
            dedupe: ["react", "react-dom"],
        },
    };
});
