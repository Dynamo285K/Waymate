import { Elysia } from "elysia";
import { auth } from "./auth";
import { AuthError, AuthErrorCodes } from "./auth.errors";

// Macros throw AuthError instead of returning status(...) inline so every
// module's .onError handler maps the failure through one shared code path
// (authErrorToHttpStatus) — see CLAUDE.md "Authentication and authorization".
export const isAuthenticated = new Elysia({ name: "better-auth" })
    .mount(auth.handler)
    .macro({
        auth: {
            async resolve({ request: { headers } }) {
                const result = await auth.api.getSession({ headers });

                if (!result?.user || !result?.session) {
                    throw new AuthError(AuthErrorCodes.Unauthorized);
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
            async resolve({ request: { headers } }) {
                const result = await auth.api.getSession({ headers });
                if (!result?.user || !result.session) {
                    throw new AuthError(AuthErrorCodes.Unauthorized);
                }
                if (
                    !result.user.firstName ||
                    !result.user.lastName ||
                    !result.user.phone
                ) {
                    throw new AuthError(AuthErrorCodes.OnboardingRequired);
                }
            },
        },
    });

export const requireAdmin = new Elysia({ name: "require-admin" })
    .use(isAuthenticated)
    .macro({
        admin: {
            async resolve({ request: { headers } }) {
                const result = await auth.api.getSession({ headers });
                if (!result?.user || !result.session) {
                    throw new AuthError(AuthErrorCodes.Unauthorized);
                }
                if (result.user.role !== "ADMIN") {
                    throw new AuthError(AuthErrorCodes.Forbidden);
                }
            },
        },
    });
