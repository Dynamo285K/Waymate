import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@repo/api";
// better-auth requires an absolute baseURL; fall back to window.location.origin
// so the same-origin `/api/auth` proxy handles cookies in dev and production.
const AUTH_BASE_URL =
    import.meta.env.VITE_AUTH_BASE_URL?.replace(/\/$/, "") ??
    `${window.location.origin}/api/auth`;

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    fetchOptions: { credentials: "include" },
    plugins: [inferAdditionalFields<Auth>(), adminClient()],
});
