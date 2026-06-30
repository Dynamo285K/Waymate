import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

// redirect() is meant to be thrown by the guard; turn it into a throwable that
// still carries `.to` so tests can assert where a blocked audience is bounced.
vi.mock("@tanstack/react-router", () => ({
    redirect: (opts: { to: string }) =>
        Object.assign(new Error("redirect"), opts),
}));

const getSession = vi.fn();
vi.mock("./auth-client", () => ({ authClient: { getSession } }));

const { requireAudience, SESSION_QUERY_KEY } = await import("./route-guards");
import type { RouterContext } from "./route-guards";

const ctx = (): RouterContext => ({ queryClient: new QueryClient() });
const user = (overrides: Record<string, unknown>) => ({
    data: { user: overrides },
});

afterEach(() => getSession.mockReset());

describe("requireAudience — request dedup", () => {
    it("shares one /get-session across guards within the cache window", async () => {
        getSession.mockResolvedValue(user({ role: "ADMIN" }));
        const context = ctx();
        const guard = requireAudience(["admin"]);
        await guard({ context, location: { pathname: "/admin" } });
        await guard({ context, location: { pathname: "/admin/users" } });
        expect(getSession).toHaveBeenCalledTimes(1);
    });

    it("refetches after the session key is invalidated", async () => {
        getSession.mockResolvedValue(user({ role: "ADMIN" }));
        const context = ctx();
        const guard = requireAudience(["admin"]);
        await guard({ context, location: { pathname: "/admin" } });
        await context.queryClient.invalidateQueries({
            queryKey: SESSION_QUERY_KEY,
        });
        await guard({ context, location: { pathname: "/admin" } });
        expect(getSession).toHaveBeenCalledTimes(2);
    });
});

describe("requireAudience — gating", () => {
    it("bounces a guest off a user route", async () => {
        getSession.mockResolvedValue({ data: null });
        await expect(
            requireAudience(["user"])({
                context: ctx(),
                location: { pathname: "/passenger" },
            })
        ).rejects.toMatchObject({ to: "/login" });
    });

    it("sends an un-onboarded user to /onboarding", async () => {
        getSession.mockResolvedValue(
            user({ role: "USER", firstName: "", lastName: "", phone: "" })
        );
        await expect(
            requireAudience(["user"])({
                context: ctx(),
                location: { pathname: "/passenger" },
            })
        ).rejects.toMatchObject({ to: "/onboarding" });
    });

    it("lets an onboarded user through", async () => {
        getSession.mockResolvedValue(
            user({ role: "USER", firstName: "A", lastName: "B", phone: "1" })
        );
        await expect(
            requireAudience(["user"])({
                context: ctx(),
                location: { pathname: "/passenger" },
            })
        ).resolves.toBeUndefined();
    });
});
