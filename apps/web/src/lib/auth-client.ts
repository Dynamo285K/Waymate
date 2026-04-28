import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@repo/api";
import { API_BASE_URL } from "./api";

const AUTH_BASE_URL =
    import.meta.env.VITE_AUTH_BASE_URL?.replace(/\/$/, "") ??
    `${API_BASE_URL}/api/auth`;

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    fetchOptions: { credentials: "include" },
    plugins: [inferAdditionalFields<Auth>()],
});
