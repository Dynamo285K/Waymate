import { Elysia } from "elysia";
import { auth } from "./auth";

export const isAuthenticated = new Elysia({ name: "better-auth" })
    .mount(auth.handler)
    .macro({
        auth: {
            async resolve({ status, request: { headers } }) {
                const result = await auth.api.getSession({
                    headers,
                });

                if (!result?.user || !result?.session) {
                    return status(401, {
                        error: "UNAUTHORIZED",
                    });
                }

                return {
                    user: result.user,
                    session: result.session,
                };
            },
        },
    });

export const isFullyOnboarded = new Elysia({ name: "require-onboarding" })
    .use(isAuthenticated)
    .macro({
        onboarded: {
            async resolve({ status, request: { headers } }) {
                const result = await auth.api.getSession({ headers });
                if (!result?.user || !result.session) {
                    return status(401, { error: "UNAUTHORIZED" });
                }
                if (
                    !result.user.firstName ||
                    !result.user.lastName ||
                    !result.user.phone
                ) {
                    return status(403, { error: "ONBOARDING_REQUIRED" });
                }
            },
        },
    });

export const requireAdmin = new Elysia({ name: "require-admin" })
    .use(isAuthenticated)
    .macro({
        admin: {
            async resolve({ status, request: { headers } }) {
                const result = await auth.api.getSession({ headers });
                if (!result?.user || !result.session) {
                    return status(401, { error: "UNAUTHORIZED" });
                }
                if (result.user.role !== "ADMIN") {
                    return status(403, { error: "FORBIDDEN" });
                }
            },
        },
    });
