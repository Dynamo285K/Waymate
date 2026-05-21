import { useState, useEffect, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
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
import "./AdminNavbar.css";

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
    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth : 1280
    );
    const navbarRef = useRef<HTMLElement>(null);

    const isDesktop = windowWidth > 1280;
    const isTablet = windowWidth > 560 && windowWidth <= 1280;
    const isMobile = windowWidth <= 560;

    useEffect(() => {
        function handleResize() {
            setWindowWidth(window.innerWidth);
        }
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
        window.addEventListener("resize", handleResize);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("resize", handleResize);
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
            className="admin-navbar__logo"
            onClick={onLogoClick}
            style={{ cursor: onLogoClick ? "pointer" : "default" }}
        />
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

    const profileMenu = (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="admin-navbar__profile-trigger-btn"
                aria-label="Open profile menu"
            >
                <Avatar
                    name={userName}
                    size="sm"
                />
                <span className="admin-navbar__profile-chevron">
                    <ChevronDownIcon />
                </span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="admin-navbar__dropdown"
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

    const secondaryControls = (
        <>
            <span className="admin-navbar__role">
                {labels?.adminRole ?? "Admin"}
            </span>
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
            className="admin-navbar"
            ref={navbarRef}
        >
            {isDesktop && (
                <div className="admin-navbar__desktop">
                    <div className="admin-navbar__left">
                        {logoImg}
                        <nav className="admin-navbar__nav">{navTabs}</nav>
                    </div>
                    <div className="admin-navbar__right">
                        {secondaryControls}
                    </div>
                </div>
            )}
            {isTablet && (
                <div className="admin-navbar__tablet">
                    <div className="admin-navbar__tablet-top">
                        {logoImg}
                        <Button
                            variant="unstyled"
                            className="admin-navbar__hamburger"
                            onClick={() => setIsMobileMenuOpen((c) => !c)}
                        >
                            <span />
                            <span />
                            <span />
                        </Button>
                    </div>
                    {isMobileMenuOpen && (
                        <div className="admin-navbar__mobile-panel">
                            <span
                                className="admin-navbar__role"
                                style={{ alignSelf: "flex-start" }}
                            >
                                {labels?.adminRole ?? "Admin"}
                            </span>
                            <div className="admin-navbar__mobile-row">
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
                                {profileMenu}
                            </div>
                        </div>
                    )}
                    <nav className="admin-navbar__tablet-nav">{navTabs}</nav>
                </div>
            )}
            {isMobile && (
                <div
                    className="admin-navbar__mobile"
                    style={{ display: "flex", flexDirection: "column" }}
                >
                    <div className="admin-navbar__mobile-top">
                        {logoImg}
                        <Button
                            variant="unstyled"
                            className="admin-navbar__hamburger"
                            onClick={() => setIsMobileMenuOpen((c) => !c)}
                        >
                            <span />
                            <span />
                            <span />
                        </Button>
                    </div>
                    {isMobileMenuOpen && (
                        <div className="admin-navbar__mobile-panel">
                            <span
                                className="admin-navbar__role"
                                style={{ alignSelf: "flex-start" }}
                            >
                                {labels?.adminRole ?? "Admin"}
                            </span>
                            <div className="admin-navbar__mobile-row">
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
                                {profileMenu}
                            </div>
                        </div>
                    )}
                    <nav className="admin-navbar__mobile-nav">{navTabs}</nav>
                </div>
            )}
        </header>
    );
}
