import {
    NavButton,
    ProfileDropdown,
    ListIcon,
    MessageCircleIcon,
    SearchIcon,
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
                onSettingsClick={onSettingsClick}
                onLogoutClick={onLogoutClick}
                labels={{
                    profile: labels?.profile,
                    myRides: labels?.dropdownMyRides,
                    messages: labels?.messages,
                    ratings: labels?.ratings,
                    settings: labels?.settings,
                    logout: labels?.logout,
                }}
            />
        </NavbarProfileMenu>
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
                <div className="min-h-18 px-4 flex items-center justify-between gap-4">
                    {logoImg}
                    <nav
                        className="flex items-center flex-wrap gap-1.5"
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
                        <div className="relative">{hamburger}</div>
                    </div>
                    {isMobileMenuOpen && (
                        <div className="border-t border-border py-3 px-4 flex flex-col gap-3 bg-background">
                            <NavbarRolePanel {...roleControlsProps} />
                        </div>
                    )}
                    <nav
                        className="flex items-center flex-wrap gap-1.5 px-4 pt-2 pb-2.5 border-t border-border nav-button:py-2 nav-button:px-2.5 nav-button:text-caption nav-button:gap-1.5"
                        aria-label="Primary navigation"
                    >
                        {navButtons}
                    </nav>
                </div>
            )}
        </NavbarShell>
    );
}
