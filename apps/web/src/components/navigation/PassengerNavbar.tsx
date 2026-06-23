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
    NavbarBottomTabs,
    NavbarProfileMenu,
    NavbarProfileSettings,
    NavbarRoleControls,
} from "./navbar-shared";
import { RoleSwitcher } from "../controls/RoleSwitcher";

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
    onLogoutClick,
    labels,
}: PassengerNavbarProps) {
    const {
        navbarRef,
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

    const profileMenu = (
        <NavbarProfileMenu
            userName={userName}
            theme={theme}
        >
            <div className="w-80 rounded-summary-card overflow-hidden bg-card border border-border shadow-dropdown-strong">
                <div className="profile-dropdown-surface:w-full profile-dropdown-surface:rounded-none profile-dropdown-surface:border-0 profile-dropdown-surface:shadow-none">
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
                </div>
                <NavbarProfileSettings
                    language={language}
                    onLanguageChange={onLanguageChange}
                    themeLabel={themeLabel}
                    themeIcon={themeIcon}
                    onThemeToggle={onThemeToggle}
                />
            </div>
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
    const compactRoleSwitcher = (
        <RoleSwitcher
            value={role}
            onChange={onRoleChange}
            labels={roleLabels}
            size="sm"
        />
    );
    const bottomTabs = (
        <NavbarBottomTabs
            items={[
                {
                    key: "find-ride",
                    label: labels?.findRide ?? "Find ride",
                    icon: <SearchIcon />,
                    active: activeTab === "find-ride",
                    onClick: onFindRideClick,
                },
                {
                    key: "my-rides",
                    label: labels?.myRides ?? "My rides",
                    icon: <ListIcon />,
                    active: activeTab === "my-rides",
                    onClick: onMyRidesClick,
                },
                {
                    key: "chat",
                    label: labels?.chat ?? "Chat",
                    icon: <MessageCircleIcon />,
                    active: activeTab === "chat",
                    badge: chatBadge,
                    onClick: onChatClick,
                },
            ]}
        />
    );

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
                <div className="min-h-16 px-4 flex items-center justify-between gap-4">
                    {logoImg}
                    <div className="flex items-center gap-4 shrink-0">
                        {compactRoleSwitcher}
                        {profileMenu}
                    </div>
                    {bottomTabs}
                </div>
            )}
            {isMobile && (
                <div className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">{logoImg}</div>
                        <div className="flex items-center gap-3 shrink-0">
                            {compactRoleSwitcher}
                            {profileMenu}
                        </div>
                    </div>
                    {bottomTabs}
                </div>
            )}
        </NavbarShell>
    );
}
