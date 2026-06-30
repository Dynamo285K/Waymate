import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const signOutFn = vi.fn();
vi.mock("./auth-client", () => ({
    authClient: { getSession, signOut: signOutFn },
}));
vi.mock("../api-client/users/users", () => ({ patchUsersMeProfile: vi.fn() }));

const { queryClient } = await import("./query-client");
const { getPostAuthPath, signOut } = await import("./auth");
const { SESSION_QUERY_KEY } = await import("./route-guards");

const onboarded = { firstName: "A", lastName: "B", phone: "1" };

afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
});

describe("getPostAuthPath", () => {
    it("sends a user with no session to onboarding", async () => {
        getSession.mockResolvedValue({ data: null });
        expect(await getPostAuthPath()).toBe("/onboarding");
    });

    it("sends an un-onboarded user to onboarding", async () => {
        getSession.mockResolvedValue({ data: { user: { role: "USER" } } });
        expect(await getPostAuthPath()).toBe("/onboarding");
    });

    it("routes an onboarded admin to /admin", async () => {
        getSession.mockResolvedValue({
            data: { user: { role: "ADMIN", ...onboarded } },
        });
        expect(await getPostAuthPath()).toBe("/admin");
    });

    it("routes an onboarded user to /passenger", async () => {
        getSession.mockResolvedValue({
            data: { user: { role: "USER", ...onboarded } },
        });
        expect(await getPostAuthPath()).toBe("/passenger");
    });

    it("refetches each call so a stale pre-login session never leaks through", async () => {
        getSession.mockResolvedValue({
            data: { user: { role: "USER", ...onboarded } },
        });
        await getPostAuthPath();
        await getPostAuthPath();
        expect(getSession).toHaveBeenCalledTimes(2);
    });
});

describe("signOut", () => {
    it("clears the cached session so guards see a guest immediately", async () => {
        queryClient.setQueryData(SESSION_QUERY_KEY, { user: { role: "USER" } });
        signOutFn.mockResolvedValue({ error: null });
        await signOut();
        expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
    });

    it("throws on a failed sign-out instead of leaving the session alive", async () => {
        queryClient.setQueryData(SESSION_QUERY_KEY, { user: { role: "USER" } });
        signOutFn.mockResolvedValue({ error: { message: "CSRF" } });
        await expect(signOut()).rejects.toThrow(/Sign-out failed/);
        // Cache untouched — the caller must not believe it was signed out.
        expect(queryClient.getQueryData(SESSION_QUERY_KEY)).not.toBeNull();
    });
});
