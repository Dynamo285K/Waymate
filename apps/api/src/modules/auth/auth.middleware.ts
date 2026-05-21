import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { AuthError, AuthErrorCodes } from "./auth.errors";
import { db } from "../../db";
import { users } from "../../db/schema";

async function assertUserCanUseSession(userId: string): Promise<void> {
    const [user] = await db
        .select({
            banned: users.banned,
            userStatus: users.userStatus,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        throw new AuthError(AuthErrorCodes.Unauthorized);
    }

    if (user.banned || user.userStatus === "BANNED") {
        throw new AuthError(AuthErrorCodes.UserBanned);
    }
}

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

                await assertUserCanUseSession(result.user.id);

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
                await assertUserCanUseSession(result.user.id);
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
                await assertUserCanUseSession(result.user.id);
                if (result.user.role !== "ADMIN") {
                    throw new AuthError(AuthErrorCodes.Forbidden);
                }
            },
        },
    });
