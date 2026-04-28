import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@repo/api";
import { API_BASE_URL } from "./api";

// better-auth requires an absolute baseURL; fall back to window.location.origin
// so the dev-server `/api` proxy in vite.config.ts continues to forward requests.
const AUTH_BASE_URL =
    import.meta.env.VITE_AUTH_BASE_URL?.replace(/\/$/, "") ??
    `${window.location.origin}${API_BASE_URL}/api/auth`;

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    fetchOptions: { credentials: "include" },
    plugins: [inferAdditionalFields<Auth>()],
});
