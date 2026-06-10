import { authClient } from "./auth-client";
import { useLayout, type LayoutContextValue } from "./use-layout";

type SessionUser = NonNullable<
    ReturnType<typeof authClient.useSession>["data"]
>["user"];

export type AudienceUserProps = {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userBio?: string;
    userCreatedAt?: Date;
};

function getDisplayName(user: SessionUser): string {
    const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return fullName || user.name || user.email;
}

export function makeAudienceComponent<
    P extends LayoutContextValue & AudienceUserProps,
>(Component: React.ComponentType<P>) {
    return function AudienceRouteComponent() {
        const layout = useLayout();
        const { data } = authClient.useSession();
        const user = data?.user;

        const props: LayoutContextValue & AudienceUserProps = {
            ...layout,
            userId: user?.id,
            userName: user ? getDisplayName(user) : undefined,
            userEmail: user?.email,
            userBio: user?.bio ?? undefined,
            userCreatedAt: user?.createdAt,
        };

        return <Component {...(props as P)} />;
    };
}
