import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { AuthError, AuthErrorCodes } from "./auth.errors";
import { db } from "../../db";
import { users } from "../../db/schema";

type ResolvedSession = NonNullable<
    Awaited<ReturnType<typeof auth.api.getSession>>
>;
type ResolvedAuth = {
    user: ResolvedSession["user"];
    session: ResolvedSession["session"];
};

// Fresh ban check against the live row — the session token may predate a ban,
// so we can't trust the (possibly cached) status carried in the session.
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

    if (user.userStatus === "SUSPENDED") {
        throw new AuthError(AuthErrorCodes.UserSuspended);
    }

    // A DELETED account is gone for all practical purposes. Any session that
    // still carries it is treated as unauthenticated so the holder is bounced
    // to login instead of silently retaining full access.
    if (user.userStatus === "DELETED") {
        throw new AuthError(AuthErrorCodes.Unauthorized);
    }
}

// Per-request memoization. A route that stacks guards (e.g.
// `{ auth: true, onboarded: true }`) runs every referenced macro's resolve, and
// each used to re-run `getSession` + the ban query — up to 4 DB round-trips per
// request. Resolving through this cache collapses that to exactly one
// `getSession` and one ban check, keyed by the Request so the entry is GC'd
// with the request (no manual cleanup). A rejection is cached too, so a failing
// guard fails consistently for the rest of the chain.
const resolvedAuthByRequest = new WeakMap<Request, Promise<ResolvedAuth>>();

function resolveAuthenticatedUser(request: Request): Promise<ResolvedAuth> {
    const cached = resolvedAuthByRequest.get(request);
    if (cached) return cached;

    const promise = (async (): Promise<ResolvedAuth> => {
        const result = await auth.api.getSession({ headers: request.headers });

        if (!result?.user || !result?.session) {
            throw new AuthError(AuthErrorCodes.Unauthorized);
        }

        await assertUserCanUseSession(result.user.id);

        return { user: result.user, session: result.session };
    })();

    resolvedAuthByRequest.set(request, promise);
    return promise;
}

// Macros throw AuthError instead of returning status(...) inline so every
// module's .onError handler maps the failure through one shared code path
// (authErrorToHttpStatus) — see CLAUDE.md "Authentication and authorization".
export const isAuthenticated = new Elysia({ name: "better-auth" })
    .mount(auth.handler)
    .macro({
        auth: {
            async resolve({ request }) {
                return await resolveAuthenticatedUser(request);
            },
        },
    });

export const isFullyOnboarded = new Elysia({ name: "require-onboarding" })
    .use(isAuthenticated)
    .macro({
        onboarded: {
            async resolve({ request }) {
                const { user } = await resolveAuthenticatedUser(request);
                if (!user.firstName || !user.lastName || !user.phone) {
                    throw new AuthError(AuthErrorCodes.OnboardingRequired);
                }
            },
        },
    });

export const requireAdmin = new Elysia({ name: "require-admin" })
    .use(isAuthenticated)
    .macro({
        admin: {
            async resolve({ request }) {
                const { user } = await resolveAuthenticatedUser(request);
                if (user.role !== "ADMIN") {
                    throw new AuthError(AuthErrorCodes.Forbidden);
                }
            },
        },
    });
