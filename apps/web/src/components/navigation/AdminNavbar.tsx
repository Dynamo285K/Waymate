import { useState, useEffect, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useBreakpoint } from "../../hooks/shared/useBreakpoint";
import {
    Avatar,
    Button,
    IconButton,
    NavButton,
    AdminProfileDropdown,
    MoonIcon,
    SunIcon,
    ChevronDownIcon,
    ListIcon,
    StarIcon,
    UserIcon,
} from "@waymate/ui";
import { LanguageSwitcher, type Language } from "../controls/LanguageSwitcher";
import logoLight from "../../assets/logo_light_mode.png";
import logoDark from "../../assets/logo_dark_mode.png";

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

function DashboardIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                x="3"
                y="3"
                width="7"
                height="7"
            />
            <rect
                x="14"
                y="3"
                width="7"
                height="7"
            />
            <rect
                x="14"
                y="14"
                width="7"
                height="7"
            />
            <rect
                x="3"
                y="14"
                width="7"
                height="7"
            />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line
                x1="12"
                y1="9"
                x2="12"
                y2="13"
            />
            <line
                x1="12"
                y1="17"
                x2="12.01"
                y2="17"
            />
        </svg>
    );
}

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navbarRef = useRef<HTMLElement>(null);

    const breakpoint = useBreakpoint(1280);
    const isDesktop = breakpoint === "desktop";
    const isTablet = breakpoint === "tablet";
    const isMobile = breakpoint === "mobile";

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                navbarRef.current &&
                !navbarRef.current.contains(e.target as Node)
            )
                setIsMobileMenuOpen(false);
        }
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setIsMobileMenuOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const logoSrc = theme === "dark" ? logoDark : logoLight;
    const themeIcon = theme === "dark" ? <SunIcon /> : <MoonIcon />;
    const themeLabel =
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    const dropdownLabels = {
        settings: labels?.settings,
        logout: labels?.logout,
    };

    const logoImg = (
        <img
            src={logoSrc}
            alt="WayMate logo"
            className={`w-24 h-auto object-contain block shrink-0 ${onLogoClick ? "cursor-pointer" : "cursor-default"}`}
            onClick={onLogoClick}
        />
    );

    const hamburger = (
        <Button
            variant="unstyled"
            className="bg-card border border-border rounded-control w-10 h-10 cursor-pointer flex flex-col items-center justify-center gap-1.25 p-0 shadow-hairline menu-line:block menu-line:w-4.5 menu-line:h-0.5 menu-line:bg-text-primary menu-line:rounded-sm"
            onClick={() => setIsMobileMenuOpen((c) => !c)}
        >
            <span />
            <span />
            <span />
        </Button>
    );

    const profileMenu = (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="inline-flex items-center gap-2 border-0 bg-transparent p-0 cursor-pointer group"
                aria-label="Open profile menu"
            >
                <Avatar
                    name={userName}
                    size="sm"
                />
                <span className="w-8 h-8 rounded-full bg-card text-text-secondary shadow-button inline-flex items-center justify-center group-hover:bg-border icon-svg:w-4 icon-svg:h-4">
                    <ChevronDownIcon />
                </span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-200"
                    sideOffset={12}
                    align="end"
                    data-theme={theme}
                >
                    <AdminProfileDropdown
                        name={userName}
                        email={userEmail}
                        onSettingsClick={onSettingsClick}
                        onLogoutClick={onLogoutClick}
                        labels={dropdownLabels}
                    />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
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

    const secondaryControls = (
        <>
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
        </>
    );

    return (
        <header
            className="w-full bg-background border-b border-border shadow-navbar"
            ref={navbarRef}
        >
            {isDesktop && (
                <div className="min-h-18 px-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 min-w-0">
                        {logoImg}
                        <nav className="flex items-center gap-5 flex-wrap">
                            {navTabs}
                        </nav>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                        {secondaryControls}
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
                            <div className="flex items-center gap-2.5">
                                <IconButton
                                    ariaLabel={themeLabel}
                                    icon={themeIcon}
                                    variant="default"
                                    onClick={onThemeToggle}
                                />
                                <LanguageSwitcher
                                    value={language}
                                    onChange={onLanguageChange}
                                />
                                <div className="ml-auto">{profileMenu}</div>
                            </div>
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
                            <div className="flex items-center gap-2.5">
                                <IconButton
                                    ariaLabel={themeLabel}
                                    icon={themeIcon}
                                    variant="default"
                                    onClick={onThemeToggle}
                                />
                                <LanguageSwitcher
                                    value={language}
                                    onChange={onLanguageChange}
                                />
                                <div className="ml-auto">{profileMenu}</div>
                            </div>
                        </div>
                    )}
                    <nav className="grid grid-cols-2 gap-1.5 px-4 pt-2 pb-2.5 border-t border-border nav-button:py-2 nav-button:px-2.5 nav-button:text-caption nav-button:gap-1.5 nav-button:justify-center nav-button:w-full">
                        {navTabs}
                    </nav>
                </div>
            )}
        </header>
    );
}
