import type { authClient } from "./auth-client";

export type SessionUser = NonNullable<
    ReturnType<typeof authClient.useSession>["data"]
>["user"];

export function getDisplayName(user: SessionUser): string {
    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || user.name || user.email;
}
