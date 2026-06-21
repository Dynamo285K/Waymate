import { useState, useEffect, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useBreakpoint } from "../../hooks/shared/useBreakpoint";
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
    chatBadge?: number;
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
    chatBadge,
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
    const navbarRef = useRef<HTMLElement>(null);

    const breakpoint = useBreakpoint(1024);
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
            className="w-24 h-auto object-contain block shrink-0"
            onClick={onLogoClick}
            style={{ cursor: onLogoClick ? "pointer" : "default" }}
        />
    );

    const hamburger = (
        <Button
            variant="unstyled"
            className="bg-(--color-card) border border-(--color-border) rounded-[10px] w-10 h-10 cursor-pointer flex flex-col items-center justify-center gap-1.25 p-0 shadow-[0_1px_4px_rgba(0,0,0,0.1)] [&_span]:block [&_span]:w-4.5 [&_span]:h-0.5 [&_span]:bg-(--color-text-primary) [&_span]:rounded-sm"
            onClick={() => setIsMobileMenuOpen((c) => !c)}
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
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
                <span className="w-8 h-8 rounded-full bg-(--color-card) text-(--color-text-secondary) shadow-[0_2px_6px_rgba(0,0,0,0.12)] inline-flex items-center justify-center group-hover:bg-(--color-border) [&_svg]:w-4 [&_svg]:h-4">
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
                <span className="inline-flex items-center gap-1.5">
                    {labels?.chat ?? "Chat"}
                    {chatBadge ? (
                        <span
                            className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-(--color-red) text-white text-[11px] font-semibold leading-none"
                            aria-label={`${chatBadge} unread`}
                        >
                            {chatBadge > 99 ? "99+" : chatBadge}
                        </span>
                    ) : null}
                </span>
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
            className="w-full bg-(--color-bg) border-b border-(--color-border) shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            ref={navbarRef}
        >
            {isDesktop && (
                <div className="min-h-18 px-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 min-w-0">
                        {logoImg}
                        <nav
                            className="flex items-center gap-5 flex-wrap"
                            aria-label="Primary navigation"
                        >
                            {navButtons}
                        </nav>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                        {roleLang}
                    </div>
                </div>
            )}
            {isTablet && (
                <div className="min-h-18 px-4 flex items-center justify-between gap-3">
                    {logoImg}
                    <nav
                        className="flex items-center gap-5 flex-wrap"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                    <div className="relative shrink-0">
                        {hamburger}
                        {isMobileMenuOpen && (
                            <div className="absolute top-[calc(100%+8px)] right-0 min-w-70 rounded-2xl border border-(--color-border) shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-30 py-3 px-4 flex flex-col gap-3 bg-(--color-bg)">
                                <RoleSwitcher
                                    value={role}
                                    onChange={onRoleChange}
                                    className="self-start shrink-0"
                                    labels={{
                                        passenger: labels?.passenger,
                                        driver: labels?.driver,
                                    }}
                                />
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
                    </div>
                </div>
            )}
            {isMobile && (
                <div className="flex flex-col">
                    <div className="flex items-center justify-between py-2.5 px-4">
                        {logoImg}
                        {hamburger}
                    </div>
                    {isMobileMenuOpen && (
                        <div className="border-t border-(--color-border) py-3 px-4 flex flex-col gap-3 bg-(--color-bg)">
                            <RoleSwitcher
                                value={role}
                                onChange={onRoleChange}
                                className="self-start shrink-0"
                                labels={{
                                    passenger: labels?.passenger,
                                    driver: labels?.driver,
                                }}
                            />
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
                    <nav
                        className="grid grid-cols-2 gap-1.5 px-4 pt-2 pb-2.5 border-t border-(--color-border) [&_.nav-button]:py-2 [&_.nav-button]:px-2.5 [&_.nav-button]:text-[13px] [&_.nav-button]:gap-1.5 [&_.nav-button]:justify-center [&_.nav-button]:w-full"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                </div>
            )}
        </header>
    );
}
