import {
    AdminProfileDropdown,
    AlertIcon,
    DashboardIcon,
    IconButton,
    ListIcon,
    MoonIcon,
    NavButton,
    StarIcon,
    SunIcon,
    UserIcon,
} from "@waymate/ui";
import type { Language } from "../controls/LanguageSwitcher";
import logoLight from "../../assets/logo_light_mode.png";
import logoDark from "../../assets/logo_dark_mode.png";
import {
    NavbarBottomTabs,
    NavbarLogo,
    NavbarProfileSurface,
    NavbarShell,
} from "./navbar-shared";
import { useNavbar } from "./use-navbar";

export type AdminNavbarTab =
    | "dashboard"
    | "rides"
    | "users"
    | "reviews"
    | "reports";

export type AdminNavbarLabels = {
    adminRole?: string;
    dashboard?: string;
    rides?: string;
    users?: string;
    reviews?: string;
    reports?: string;
    logout?: string;
};

export type AdminNavbarProps = {
    activeTab?: AdminNavbarTab;
    language: Language;
    onLanguageChange: (value: Language) => void;
    theme?: "light" | "dark";
    onThemeToggle?: () => void;
    userName?: string;
    userEmail?: string;
    onLogoClick?: () => void;
    onDashboardClick?: () => void;
    onRidesClick?: () => void;
    onUsersClick?: () => void;
    onReviewsClick?: () => void;
    onReportsClick?: () => void;
    onMessagesClick?: () => void;
    onRatingsClick?: () => void;
    onLogoutClick?: () => void;
    labels?: AdminNavbarLabels;
};

export function AdminNavbar({
    activeTab,
    language,
    onLanguageChange,
    theme = "light",
    onThemeToggle,
    userName = "Admin",
    userEmail = "admin@waymate.com",
    onLogoClick,
    onDashboardClick,
    onRidesClick,
    onUsersClick,
    onReviewsClick,
    onReportsClick,
    onLogoutClick,
    labels,
}: AdminNavbarProps) {
    const { navbarRef, isDesktop, isTablet, isMobile, themeIcon, themeLabel } =
        useNavbar({ breakpointWidth: 1024, theme });

    const logoImg = (
        <NavbarLogo
            logoSrc={theme === "dark" ? logoDark : logoLight}
            onLogoClick={onLogoClick}
        />
    );

    const adminBadge = (
        <span className="bg-primary text-white shadow-primary-sm flex items-center justify-center rounded-full py-2 px-5 text-sm font-semibold border-0 cursor-default self-center shrink-0">
            {labels?.adminRole ?? "Admin"}
        </span>
    );

    const profileMenu = (
        <NavbarProfileSurface
            userName={userName}
            theme={theme}
            language={language}
            onLanguageChange={onLanguageChange}
            themeLabel={themeLabel}
            themeIcon={themeIcon}
            onThemeToggle={onThemeToggle}
        >
            <AdminProfileDropdown
                name={userName}
                email={userEmail}
                onLogoutClick={onLogoutClick}
                labels={{ logout: labels?.logout }}
            />
        </NavbarProfileSurface>
    );

    const navItems = [
        {
            key: "dashboard",
            label: labels?.dashboard ?? "Dashboard",
            icon: <DashboardIcon />,
            active: activeTab === "dashboard",
            onClick: onDashboardClick,
        },
        {
            key: "rides",
            label: labels?.rides ?? "Rides",
            icon: <ListIcon />,
            active: activeTab === "rides",
            onClick: onRidesClick,
        },
        {
            key: "users",
            label: labels?.users ?? "Users",
            icon: <UserIcon />,
            active: activeTab === "users",
            onClick: onUsersClick,
        },
        {
            key: "reviews",
            label: labels?.reviews ?? "Reviews",
            icon: <StarIcon />,
            active: activeTab === "reviews",
            onClick: onReviewsClick,
        },
        {
            key: "reports",
            label: labels?.reports ?? "Reports",
            icon: <AlertIcon />,
            active: activeTab === "reports",
            onClick: onReportsClick,
        },
    ];

    const navTabs = (
        <>
            {navItems.map((item) => (
                <NavButton
                    key={item.key}
                    icon={item.icon}
                    active={item.active}
                    onClick={item.onClick}
                >
                    {item.label}
                </NavButton>
            ))}
        </>
    );

    const bottomTabs = <NavbarBottomTabs items={navItems} />;

    return (
        <>
            <NavbarShell navRef={navbarRef}>
                {isDesktop && (
                    <div className="min-h-18 px-6 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-8 min-w-0">
                            {logoImg}
                            <nav
                                className="flex items-center gap-5 flex-wrap"
                                aria-label="Admin navigation"
                            >
                                {navTabs}
                            </nav>
                        </div>
                        <div className="flex items-center gap-5 shrink-0">
                            {adminBadge}
                            <div className="inline-flex rounded-full bg-card shadow-control-floating">
                                <IconButton
                                    ariaLabel={themeLabel}
                                    icon={
                                        theme === "dark" ? (
                                            <SunIcon />
                                        ) : (
                                            <MoonIcon />
                                        )
                                    }
                                    variant="default"
                                    onClick={onThemeToggle}
                                />
                            </div>
                            {profileMenu}
                        </div>
                    </div>
                )}
                {isTablet && (
                    <div className="min-h-16 px-4 flex items-center justify-between gap-4">
                        {logoImg}
                        <div className="flex items-center gap-4 shrink-0">
                            {adminBadge}
                            {profileMenu}
                        </div>
                    </div>
                )}
                {isMobile && (
                    <div className="px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">{logoImg}</div>
                            <div className="flex items-center gap-3 shrink-0">
                                {adminBadge}
                                {profileMenu}
                            </div>
                        </div>
                    </div>
                )}
            </NavbarShell>
            {!isDesktop && bottomTabs}
        </>
    );
}
