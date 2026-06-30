import { redirect } from "@tanstack/react-router";
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { authClient } from "./auth-client";

export interface RouterContext {
    queryClient: QueryClient;
}

// Single source of the current session. Every route guard reads it through the
// query cache, so a navigation that matches several guarded routes (plus the
// post-login redirect) shares ONE /get-session call instead of one per
// consumer. Auth mutations (sign-in/out, profile edits) invalidate this key —
// see auth.ts — so a stale session never gates a route.
export const SESSION_QUERY_KEY = ["session"] as const;

export const sessionQueryOptions = queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => (await authClient.getSession()).data,
    // ponytail: 30s reuse window — a navigation burst shares one fetch, and a
    // guard past the window refetches so server-side session changes (expiry,
    // ban, role) surface within 30s. Auth mutations invalidate for immediate
    // freshness. Bump if even per-30s refetches matter.
    staleTime: 30_000,
});

// The app has exactly three audiences. Every route declares which of them may
// reach it; everyone else is bounced to their own home. Keeping the model
// closed (no implicit "authenticated, partly-onboarded" leak-through state)
// is the whole point — the role is `guest | user | admin`, nothing else.
export type Audience = "guest" | "user" | "admin";

function audienceFromRole(role: string | null | undefined): Audience {
    if (!role) return "guest";
    if (role === "ADMIN") return "admin";
    return "user";
}

const HOME_BY_AUDIENCE: Record<Audience, "/login" | "/passenger" | "/admin"> = {
    guest: "/login",
    user: "/passenger",
    admin: "/admin",
};

export function hasCompletedOnboarding(user: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
}): boolean {
    return Boolean(
        user.firstName?.trim() && user.lastName?.trim() && user.phone?.trim()
    );
}

export const requireAudience =
    (allowed: ReadonlyArray<Audience>) =>
    async ({
        context,
        location,
    }: {
        context: RouterContext;
        location: { pathname: string };
    }): Promise<void> => {
        const session =
            await context.queryClient.fetchQuery(sessionQueryOptions);
        const user = session?.user;
        const current = audienceFromRole(user?.role);

        if (!allowed.includes(current)) {
            throw redirect({
                to: HOME_BY_AUDIENCE[current] as never,
                replace: true,
            });
        }
        if (current === "user" && user) {
            const onboarded = hasCompletedOnboarding(user);
            if (!onboarded && location.pathname !== "/onboarding") {
                throw redirect({ to: "/onboarding" as never, replace: true });
            }
            if (onboarded && location.pathname === "/onboarding") {
                throw redirect({
                    to: HOME_BY_AUDIENCE.user as never,
                    replace: true,
                });
            }
        }
    };
