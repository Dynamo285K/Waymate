import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { useSession } from "../../lib/use-session";
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
    const { data: session } = useSession();
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

    const activeTab = getDriverActiveTab(location.pathname);
    const isChat = activeTab === "chat";

    return (
        <div
            data-theme={theme}
            className={`${isChat ? "h-[100dvh] overflow-hidden" : "min-h-screen"} flex flex-col bg-background`}
        >
            <DriverNavbar {...navbarProps} />
            <main
                className={`flex flex-col flex-1 min-h-0 ${isChat ? "pb-[73px] lg:pb-0" : "pb-24 lg:pb-0"}`}
            >
                <Outlet />
            </main>
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
