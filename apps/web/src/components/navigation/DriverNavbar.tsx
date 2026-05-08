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
    PlusIcon,
    ListIcon,
    MessageCircleIcon,
    ChevronDownIcon,
} from "@waymate/ui";
import { LanguageSwitcher, type Language } from "../controls/LanguageSwitcher";
import { RoleSwitcher, type Role } from "../controls/RoleSwitcher";
import logoLight from "../../assets/logo_light_mode.png";
import logoDark from "../../assets/logo_dark_mode.png";
import "./DriverNavbar.css";

export type DriverNavbarTab =
    | "offer-ride"
    | "my-rides"
    | "ride-requests"
    | "chat";

export type DriverNavbarLabels = {
    passenger?: string;
    driver?: string;
    offerRide?: string;
    myRides?: string;
    rideRequests?: string;
    chat?: string;
    profile?: string;
    dropdownMyRides?: string;
    messages?: string;
    ratings?: string;
    settings?: string;
    logout?: string;
};

export type DriverNavbarProps = {
    activeTab?: DriverNavbarTab;
    language: Language;
    onLanguageChange: (value: Language) => void;
    role: Role;
    onRoleChange: (value: Role) => void;
    theme?: "light" | "dark";
    onThemeToggle?: () => void;
    userName?: string;
    userEmail?: string;
    onLogoClick?: () => void;
    onOfferRideClick?: () => void;
    onMyRidesClick?: () => void;
    onRideRequestsClick?: () => void;
    onChatClick?: () => void;
    onProfileClick?: () => void;
    onMessagesClick?: () => void;
    onRatingsClick?: () => void;
    onSettingsClick?: () => void;
    onLogoutClick?: () => void;
    labels?: DriverNavbarLabels;
};

export function DriverNavbar({
    activeTab,
    language,
    onLanguageChange,
    role,
    onRoleChange,
    theme = "light",
    onThemeToggle,
    userName = "Tomáš Olbert",
    userEmail = "najviacpracujuci@gmail.com",
    onLogoClick,
    onOfferRideClick,
    onMyRidesClick,
    onRideRequestsClick,
    onChatClick,
    onProfileClick,
    onMessagesClick,
    onRatingsClick,
    onSettingsClick,
    onLogoutClick,
    labels,
}: DriverNavbarProps) {
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

    const logoImg = (
        <img
            src={logoSrc}
            alt="WayMate logo"
            className="driver-navbar__logo"
            onClick={onLogoClick}
            style={{ cursor: onLogoClick ? "pointer" : "default" }}
        />
    );

    const profileMenu = (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="driver-navbar__profile-trigger-btn"
                aria-label="Open profile menu"
            >
                <Avatar
                    name={userName}
                    size="sm"
                />
                <span className="driver-navbar__profile-chevron">
                    <ChevronDownIcon />
                </span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="driver-navbar__dropdown"
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
                icon={<PlusIcon />}
                active={activeTab === "offer-ride"}
                onClick={onOfferRideClick}
            >
                {labels?.offerRide ?? "Offer ride"}
            </NavButton>
            <NavButton
                icon={<ListIcon />}
                active={activeTab === "my-rides"}
                onClick={onMyRidesClick}
            >
                {labels?.myRides ?? "My rides"}
            </NavButton>
            <NavButton
                icon={<ListIcon />}
                active={activeTab === "ride-requests"}
                onClick={onRideRequestsClick}
            >
                {labels?.rideRequests ?? "Ride requests"}
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

    return (
        <header
            className="driver-navbar"
            ref={navbarRef}
        >
            {isDesktop && (
                <div className="driver-navbar__desktop">
                    <div className="driver-navbar__left">
                        {logoImg}
                        <nav
                            className="driver-navbar__nav"
                            aria-label="Primary navigation"
                        >
                            {navButtons}
                        </nav>
                    </div>
                    <div className="driver-navbar__right">{roleLang}</div>
                </div>
            )}
            {isTablet && (
                <div className="driver-navbar__tablet">
                    {logoImg}
                    <nav
                        className="driver-navbar__nav"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                    <div className="driver-navbar__tablet-right">
                        <Button
                            variant="unstyled"
                            className="driver-navbar__hamburger"
                            onClick={() => setIsMobileMenuOpen((c) => !c)}
                            aria-label="Open menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span />
                            <span />
                            <span />
                        </Button>
                        {isMobileMenuOpen && (
                            <div className="driver-navbar__mobile-panel driver-navbar__tablet-panel">
                                <RoleSwitcher
                                    value={role}
                                    onChange={onRoleChange}
                                    labels={{
                                        passenger: labels?.passenger,
                                        driver: labels?.driver,
                                    }}
                                />
                                <div className="driver-navbar__mobile-row">
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
                <div className="driver-navbar__mobile">
                    <div className="driver-navbar__mobile-top">
                        {logoImg}
                        <Button
                            variant="unstyled"
                            className="driver-navbar__hamburger"
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
                        <div className="driver-navbar__mobile-panel">
                            <RoleSwitcher
                                value={role}
                                onChange={onRoleChange}
                                labels={{
                                    passenger: labels?.passenger,
                                    driver: labels?.driver,
                                }}
                            />
                            <div className="driver-navbar__mobile-row">
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
                        className="driver-navbar__mobile-nav"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                </div>
            )}
        </header>
    );
}
