import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { AdminNavbar } from "../../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../../features/admin/hooks/useAdminNavbarProps";
import { authClient } from "../../lib/auth-client";
import { requireAudience } from "../../lib/route-guards";
import { getDisplayName } from "../../lib/session-user";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/admin")({
    beforeLoad: requireAudience(["admin"]),
    component: AdminRouteLayout,
});

function AdminRouteLayout() {
    const location = useLocation();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;

    const navbarProps = useAdminNavbarProps({
        activeTab: getAdminActiveTab(location.pathname),
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
            className="min-h-screen bg-background text-text-primary"
        >
            <AdminNavbar {...navbarProps} />
            <main className="bg-background pb-24 lg:pb-0">
                <Outlet />
            </main>
        </div>
    );
}

function getAdminActiveTab(pathname: string) {
    if (pathname.startsWith("/admin/rides")) return "rides" as const;
    if (pathname.startsWith("/admin/users")) return "users" as const;
    if (pathname.startsWith("/admin/reviews")) return "reviews" as const;
    if (pathname.startsWith("/admin/reports")) return "reports" as const;
    return "dashboard" as const;
}
