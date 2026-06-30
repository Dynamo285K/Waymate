import type { authClient } from "./auth-client";

// Derived from getSession — the source the ["session"] query (and useSession
// hook) actually reads — rather than the retired useSession nanostore.
export type SessionUser = NonNullable<
    Awaited<ReturnType<typeof authClient.getSession>>["data"]
>["user"];

export function getDisplayName(user: SessionUser): string {
    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || user.name || user.email;
}
