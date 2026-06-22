import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { authClient } from "../../lib/auth-client";
import { requireAudience } from "../../lib/route-guards";
import { getDisplayName } from "../../lib/session-user";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/driver")({
    beforeLoad: requireAudience(["user"]),
    component: DriverRouteLayout,
});

function DriverRouteLayout() {
    const location = useLocation();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;

    const navbarProps = useDriverNavbarProps({
        activeTab: getDriverActiveTab(location.pathname),
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
            <DriverNavbar {...navbarProps} />
            <Outlet />
        </div>
    );
}

function getDriverActiveTab(pathname: string) {
    if (pathname.startsWith("/driver/offer")) return "offer-ride" as const;
    if (pathname.startsWith("/driver/rides")) return "my-rides" as const;
    if (pathname.startsWith("/driver/requests"))
        return "ride-requests" as const;
    if (pathname.startsWith("/driver/chat")) return "chat" as const;
    return undefined;
}
