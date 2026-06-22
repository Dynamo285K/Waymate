import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { PassengerNavbar } from "../../components/navigation/PassengerNavbar";
import { usePassengerNavbarProps } from "../../hooks/shared/usePassengerNavbarProps";
import { authClient } from "../../lib/auth-client";
import { requireAudience } from "../../lib/route-guards";
import { getDisplayName } from "../../lib/session-user";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/passenger")({
    beforeLoad: requireAudience(["user"]),
    component: PassengerRouteLayout,
});

function PassengerRouteLayout() {
    const location = useLocation();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;

    const navbarProps = usePassengerNavbarProps({
        activeTab: getPassengerActiveTab(location.pathname),
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName: user ? getDisplayName(user) : undefined,
        userEmail: user?.email,
    });

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background pb-24 lg:pb-0"
        >
            <PassengerNavbar {...navbarProps} />
            <Outlet />
        </div>
    );
}

function getPassengerActiveTab(pathname: string) {
    if (pathname.startsWith("/passenger/rides")) return "my-rides" as const;
    if (pathname.startsWith("/passenger/chat")) return "chat" as const;
    return "find-ride" as const;
}
