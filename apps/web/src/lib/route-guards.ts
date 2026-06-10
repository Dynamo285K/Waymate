import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import {
    CURRENT_USER_QUERY_KEY,
    getCurrentUserOrNull,
    hasCompletedOnboarding,
} from "./auth";
import type { User } from "../api-client/model/user";
import type { UserRole } from "../api-client/model/userRole";

export interface RouterContext {
    queryClient: QueryClient;
}

// Resolve the current user for the route guard. `fetchQuery` reuses the
// `CURRENT_USER_QUERY_KEY` cache while it is fresh (the QueryClient default
// staleTime), so a burst of navigations no longer fans out into one
// `/users/me` request per route change. Auth transitions explicitly drop the
// entry — `LoginPage` invalidates it, `useLogout` removes it — so the next
// guard run re-fetches. `LayoutProvider` shares the same cache entry.
async function fetchUser(queryClient: QueryClient): Promise<User | null> {
    return queryClient.fetchQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: getCurrentUserOrNull,
    });
}

// The app has exactly three audiences. Every route declares which of them may
// reach it; everyone else is bounced to their own home. Keeping the model
// closed (no implicit "authenticated, partly-onboarded" leak-through state)
// is the whole point — the role is `guest | user | admin`, nothing else.
export type Audience = "guest" | "user" | "admin";

function audienceFromRole(role: UserRole | null): Audience {
    if (role === null) return "guest";
    if (role === "ADMIN") return "admin";
    return "user";
}

const HOME_BY_AUDIENCE: Record<Audience, string> = {
    guest: "/login",
    user: "/passenger",
    admin: "/admin",
};

export const requireAudience =
    (allowed: ReadonlyArray<Audience>) =>
    async ({
        context,
        location,
    }: {
        context: RouterContext;
        location: { pathname: string };
    }): Promise<void> => {
        const user = await fetchUser(context.queryClient);
        const current = audienceFromRole(user?.userRole ?? null);
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
