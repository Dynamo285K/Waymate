import { useState, useEffect, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    Avatar,
    Button,
    IconButton,
    NavButton,
    ProfileDropdown,
    MoonIcon,
    SunIcon,
    ListIcon,
    MessageCircleIcon,
    SearchIcon,
    ChevronDownIcon,
} from "@waymate/ui";
import { LanguageSwitcher, type Language } from "../controls/LanguageSwitcher";
import { RoleSwitcher, type Role } from "../controls/RoleSwitcher";
import logoLight from "../../assets/logo_light_mode.png";
import logoDark from "../../assets/logo_dark_mode.png";
import "./PassengerNavbar.css";

export type PassengerNavbarTab = "find-ride" | "my-rides" | "chat";

export type PassengerNavbarLabels = {
    passenger?: string;
    driver?: string;
    findRide?: string;
    myRides?: string;
    chat?: string;
    profile?: string;
    dropdownMyRides?: string;
    messages?: string;
    ratings?: string;
    settings?: string;
    logout?: string;
};

export type PassengerNavbarProps = {
    activeTab?: PassengerNavbarTab;
    language: Language;
    onLanguageChange: (value: Language) => void;
    role: Role;
    onRoleChange: (value: Role) => void;
    theme?: "light" | "dark";
    onThemeToggle?: () => void;
    userName?: string;
    userEmail?: string;
    onLogoClick?: () => void;
    onFindRideClick?: () => void;
    onMyRidesClick?: () => void;
    onChatClick?: () => void;
    onProfileClick?: () => void;
    onMessagesClick?: () => void;
    onRatingsClick?: () => void;
    onSettingsClick?: () => void;
    onLogoutClick?: () => void;
    labels?: PassengerNavbarLabels;
};

export function PassengerNavbar({
    activeTab = "my-rides",
    language,
    onLanguageChange,
    role,
    onRoleChange,
    theme = "light",
    onThemeToggle,
    userName = "Tomáš Olbert",
    userEmail = "najviacpracujuci@gmail.com",
    onLogoClick,
    onFindRideClick,
    onMyRidesClick,
    onChatClick,
    onProfileClick,
    onMessagesClick,
    onRatingsClick,
    onSettingsClick,
    onLogoutClick,
    labels,
}: PassengerNavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth : 1280
    );
    const navbarRef = useRef<HTMLElement>(null);

    const isDesktop = windowWidth > 1024;
    const isTablet = windowWidth > 560 && windowWidth <= 1024;
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

    const profileDropdownLabels = {
        profile: labels?.profile,
        myRides: labels?.dropdownMyRides,
        messages: labels?.messages,
        ratings: labels?.ratings,
        settings: labels?.settings,
        logout: labels?.logout,
    };

    const profileMenu = (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="passenger-navbar__profile-trigger-btn"
                aria-label="Open profile menu"
            >
                <Avatar
                    name={userName}
                    size="sm"
                />
                <span className="passenger-navbar__profile-chevron">
                    <ChevronDownIcon />
                </span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="passenger-navbar__dropdown"
                    sideOffset={12}
                    align="end"
                >
                    <ProfileDropdown
                        name={userName}
                        email={userEmail}
                        onProfileClick={onProfileClick}
                        onMyRidesClick={onMyRidesClick}
                        onMessagesClick={onMessagesClick}
                        onRatingsClick={onRatingsClick}
                        onSettingsClick={onSettingsClick}
                        onLogoutClick={onLogoutClick}
                        labels={profileDropdownLabels}
                    />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );

    const navButtons = (
        <>
            <NavButton
                icon={<SearchIcon />}
                active={activeTab === "find-ride"}
                onClick={onFindRideClick}
            >
                {labels?.findRide ?? "Find ride"}
            </NavButton>
            <NavButton
                icon={<ListIcon />}
                active={activeTab === "my-rides"}
                onClick={onMyRidesClick}
            >
                {labels?.myRides ?? "My rides"}
            </NavButton>
            <NavButton
                icon={<MessageCircleIcon />}
                active={activeTab === "chat"}
                onClick={onChatClick}
            >
                {labels?.chat ?? "Chat"}
            </NavButton>
        </>
    );

    const roleLang = (
        <>
            <RoleSwitcher
                value={role}
                onChange={onRoleChange}
                labels={{
                    passenger: labels?.passenger,
                    driver: labels?.driver,
                }}
            />
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

    const logoImg = (src: string) => (
        <img
            src={src}
            alt="WayMate logo"
            className="passenger-navbar__logo"
            onClick={onLogoClick}
            style={{ cursor: onLogoClick ? "pointer" : "default" }}
        />
    );

    return (
        <header
            className="passenger-navbar"
            ref={navbarRef}
        >
            {isDesktop && (
                <div className="passenger-navbar__desktop">
                    <div className="passenger-navbar__left">
                        {logoImg(logoSrc)}
                        <nav
                            className="passenger-navbar__nav"
                            aria-label="Primary navigation"
                        >
                            {navButtons}
                        </nav>
                    </div>
                    <div className="passenger-navbar__right">{roleLang}</div>
                </div>
            )}
            {isTablet && (
                <div className="passenger-navbar__tablet">
                    {logoImg(logoSrc)}
                    <nav
                        className="passenger-navbar__nav"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                    <div className="passenger-navbar__tablet-right">
                        <Button
                            variant="unstyled"
                            type="button"
                            className="passenger-navbar__hamburger"
                            onClick={() => setIsMobileMenuOpen((c) => !c)}
                            aria-label="Open menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span />
                            <span />
                            <span />
                        </Button>
                        {isMobileMenuOpen && (
                            <div className="passenger-navbar__mobile-panel passenger-navbar__tablet-panel">
                                <RoleSwitcher
                                    value={role}
                                    onChange={onRoleChange}
                                    labels={{
                                        passenger: labels?.passenger,
                                        driver: labels?.driver,
                                    }}
                                />
                                <div className="passenger-navbar__mobile-row">
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
                    </div>
                </div>
            )}
            {isMobile && (
                <div className="passenger-navbar__mobile">
                    <div className="passenger-navbar__mobile-top">
                        {logoImg(logoSrc)}
                        <Button
                            variant="unstyled"
                            type="button"
                            className="passenger-navbar__hamburger"
                            onClick={() => setIsMobileMenuOpen((c) => !c)}
                            aria-label="Open menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span />
                            <span />
                            <span />
                        </Button>
                    </div>
                    {isMobileMenuOpen && (
                        <div className="passenger-navbar__mobile-panel">
                            <RoleSwitcher
                                value={role}
                                onChange={onRoleChange}
                                labels={{
                                    passenger: labels?.passenger,
                                    driver: labels?.driver,
                                }}
                            />
                            <div className="passenger-navbar__mobile-row">
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
                    <nav
                        className="passenger-navbar__mobile-nav"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                </div>
            )}
        </header>
    );
}
