import { treaty } from "@elysiajs/eden";
import type { App } from "@repo/api";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "/api";

export const api = treaty<App>(API_BASE_URL, {
    fetch: { credentials: "include" },
    keepDomain: true,
});
