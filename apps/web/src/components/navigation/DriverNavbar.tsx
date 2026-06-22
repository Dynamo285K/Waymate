import {
    NavButton,
    ProfileDropdown,
    PlusIcon,
    ListIcon,
    MessageCircleIcon,
} from "@waymate/ui";
import { type Language } from "../controls/LanguageSwitcher";
import { type Role } from "../controls/RoleSwitcher";
import { useNavbar } from "./use-navbar";
import {
    NavbarShell,
    NavbarLogo,
    NavbarHamburger,
    NavbarProfileMenu,
    NavbarRoleControls,
    NavbarRolePanel,
} from "./navbar-shared";

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
    onLogoutClick,
    labels,
}: DriverNavbarProps) {
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
    } = useNavbar({ breakpointWidth: 1024, theme });

    const roleLabels = { passenger: labels?.passenger, driver: labels?.driver };

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
            <ProfileDropdown
                name={userName}
                email={userEmail}
                onProfileClick={onProfileClick}
                onMyRidesClick={onMyRidesClick}
                onMessagesClick={onMessagesClick}
                onRatingsClick={onRatingsClick}
                onLogoutClick={onLogoutClick}
                labels={{
                    profile: labels?.profile,
                    myRides: labels?.dropdownMyRides,
                    messages: labels?.messages,
                    ratings: labels?.ratings,
                    logout: labels?.logout,
                }}
            />
        </NavbarProfileMenu>
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
                            className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red text-white text-badge font-semibold leading-none"
                            aria-label={`${chatBadge} unread`}
                        >
                            {chatBadge > 99 ? "99+" : chatBadge}
                        </span>
                    ) : null}
                </span>
            </NavButton>
        </>
    );

    const roleControlsProps = {
        role,
        onRoleChange,
        roleLabels,
        language,
        onLanguageChange,
        themeLabel,
        themeIcon,
        onThemeToggle,
        profileMenu,
    };

    return (
        <NavbarShell navRef={navbarRef}>
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
                        <NavbarRoleControls {...roleControlsProps} />
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
                            <div className="absolute top-nav-dropdown-offset right-0 min-w-70 rounded-2xl border border-border shadow-dropdown-strong z-30 py-3 px-4 flex flex-col gap-3 bg-background">
                                <NavbarRolePanel {...roleControlsProps} />
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
                        <div className="border-t border-border py-3 px-4 flex flex-col gap-3 bg-background">
                            <NavbarRolePanel {...roleControlsProps} />
                        </div>
                    )}
                    <nav
                        className="grid grid-cols-2 gap-1.5 px-4 pt-2 pb-2.5 border-t border-border nav-button:py-2 nav-button:px-2.5 nav-button:text-caption nav-button:gap-1.5 nav-button:justify-center nav-button:w-full"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                </div>
            )}
        </NavbarShell>
    );
}
