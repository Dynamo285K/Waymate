import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const getSession = vi.fn();
vi.mock("./auth-client", () => ({ authClient: { getSession } }));

const { useSession } = await import("./use-session");
const { sessionQueryOptions } = await import("./route-guards");

afterEach(() => getSession.mockReset());

const wrapperFor =
    (client: QueryClient) =>
    ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

describe("useSession", () => {
    it("reads the guard-primed cache without a second /get-session", async () => {
        getSession.mockResolvedValue({ data: { user: { role: "ADMIN" } } });
        const client = new QueryClient();
        // What requireAudience does in beforeLoad, before the component renders.
        await client.fetchQuery(sessionQueryOptions);

        const { result } = renderHook(() => useSession(), {
            wrapper: wrapperFor(client),
        });

        await waitFor(() =>
            expect(result.current.data?.user.role).toBe("ADMIN")
        );
        // Component read was a cache hit — the guard's fetch was the only one.
        expect(getSession).toHaveBeenCalledTimes(1);
    });
});
