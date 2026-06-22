import {
    IconButton,
    NavButton,
    AdminProfileDropdown,
    DashboardIcon,
    AlertIcon,
    ListIcon,
    StarIcon,
    UserIcon,
} from "@waymate/ui";
import { LanguageSwitcher, type Language } from "../controls/LanguageSwitcher";
import { useNavbar } from "./use-navbar";
import {
    NavbarShell,
    NavbarLogo,
    NavbarHamburger,
    NavbarProfileMenu,
    NavbarControlsRow,
} from "./navbar-shared";

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
    settings?: string;
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
    onSettingsClick?: () => void;
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
    onSettingsClick,
    onLogoutClick,
    labels,
}: AdminNavbarProps) {
    const {
        navbarRef,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isDesktop,
        isTablet,
        isMobile,
        logoSrc,
        themeIcon,
        themeLabel,
    } = useNavbar({ breakpointWidth: 1280, theme });

    const logoImg = (
        <NavbarLogo
            logoSrc={logoSrc}
            onLogoClick={onLogoClick}
        />
    );

    const hamburger = (
        <NavbarHamburger
            open={isMobileMenuOpen}
            onToggle={() => setIsMobileMenuOpen((c) => !c)}
        />
    );

    const profileMenu = (
        <NavbarProfileMenu
            userName={userName}
            theme={theme}
        >
            <AdminProfileDropdown
                name={userName}
                email={userEmail}
                onSettingsClick={onSettingsClick}
                onLogoutClick={onLogoutClick}
                labels={{
                    settings: labels?.settings,
                    logout: labels?.logout,
                }}
            />
        </NavbarProfileMenu>
    );

    const navTabs = (
        <>
            <NavButton
                icon={<DashboardIcon />}
                active={activeTab === "dashboard"}
                onClick={onDashboardClick}
            >
                {labels?.dashboard ?? "Dashboard"}
            </NavButton>
            <NavButton
                icon={<ListIcon />}
                active={activeTab === "rides"}
                onClick={onRidesClick}
            >
                {labels?.rides ?? "Rides"}
            </NavButton>
            <NavButton
                icon={<UserIcon />}
                active={activeTab === "users"}
                onClick={onUsersClick}
            >
                {labels?.users ?? "Users"}
            </NavButton>
            <NavButton
                icon={<StarIcon />}
                active={activeTab === "reviews"}
                onClick={onReviewsClick}
            >
                {labels?.reviews ?? "Reviews"}
            </NavButton>
            <NavButton
                icon={<AlertIcon />}
                active={activeTab === "reports"}
                onClick={onReportsClick}
            >
                {labels?.reports ?? "Reports"}
            </NavButton>
        </>
    );

    const adminBadge = (
        <span className="bg-primary flex items-center justify-center text-white rounded-full py-2 px-5 text-sm font-semibold border-0 cursor-default self-center shrink-0">
            {labels?.adminRole ?? "Admin"}
        </span>
    );

    const controlsRow = (
        <NavbarControlsRow
            language={language}
            onLanguageChange={onLanguageChange}
            themeLabel={themeLabel}
            themeIcon={themeIcon}
            onThemeToggle={onThemeToggle}
            profileMenu={profileMenu}
        />
    );

    return (
        <NavbarShell navRef={navbarRef}>
            {isDesktop && (
                <div className="min-h-18 px-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 min-w-0">
                        {logoImg}
                        <nav className="flex items-center gap-5 flex-wrap">
                            {navTabs}
                        </nav>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                        {adminBadge}
                        <LanguageSwitcher
                            value={language}
                            onChange={onLanguageChange}
                        />
                        <IconButton
                            ariaLabel={themeLabel}
                            icon={themeIcon}
                            variant="default"
                            onClick={onThemeToggle}
                        />
                        {profileMenu}
                    </div>
                </div>
            )}
            {isTablet && (
                <div className="flex flex-col">
                    <div className="flex items-center justify-between py-2.5 px-4 min-h-15">
                        {logoImg}
                        {hamburger}
                    </div>
                    {isMobileMenuOpen && (
                        <div className="border-t border-border py-3 px-4 flex flex-col gap-3 bg-background">
                            {adminBadge}
                            {controlsRow}
                        </div>
                    )}
                    <nav className="flex items-center gap-1 px-4 pt-1.5 pb-2 border-t border-border overflow-x-auto scrollbar-none nav-button:shrink-0 nav-button:text-caption nav-button:py-1.5 nav-button:px-3 nav-button:gap-1.5">
                        {navTabs}
                    </nav>
                </div>
            )}
            {isMobile && (
                <div className="flex flex-col">
                    <div className="flex items-center justify-between py-2.5 px-4">
                        {logoImg}
                        {hamburger}
                    </div>
                    {isMobileMenuOpen && (
                        <div className="border-t border-border py-3 px-4 flex flex-col gap-3 bg-background">
                            {adminBadge}
                            {controlsRow}
                        </div>
                    )}
                    <nav className="grid grid-cols-2 gap-1.5 px-4 pt-2 pb-2.5 border-t border-border nav-button:py-2 nav-button:px-2.5 nav-button:text-caption nav-button:gap-1.5 nav-button:justify-center nav-button:w-full">
                        {navTabs}
                    </nav>
                </div>
            )}
        </NavbarShell>
    );
}
