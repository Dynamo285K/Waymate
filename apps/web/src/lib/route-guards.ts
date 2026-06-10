import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { authClient } from "./auth-client";

export interface RouterContext {
    queryClient: QueryClient;
}

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
    async ({ location }: { location: { pathname: string } }): Promise<void> => {
        const { data: session } = await authClient.getSession();
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
