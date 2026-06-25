import {
    NavButton,
    PlusIcon,
    ListIcon,
    ListChecksIcon,
    MessageCircleIcon,
} from "@waymate/ui";
import { type Language } from "../controls/LanguageSwitcher";
import { type Role } from "../controls/RoleSwitcher";
import { useNavbar } from "./use-navbar";
import {
    NavbarLogo,
    NavbarBottomTabs,
    NavbarRoleControls,
    NavbarProfileDropdownMenu,
    RoleNavbarLayout,
} from "./navbar-shared";
import { RoleSwitcher } from "../controls/RoleSwitcher";

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
        <NavbarProfileDropdownMenu
            userName={userName}
            userEmail={userEmail}
            theme={theme}
            language={language}
            onLanguageChange={onLanguageChange}
            themeLabel={themeLabel}
            themeIcon={themeIcon}
            onThemeToggle={onThemeToggle}
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
                icon={<ListChecksIcon />}
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
                    key: "offer-ride",
                    label: labels?.offerRide ?? "Offer ride",
                    icon: <PlusIcon />,
                    active: activeTab === "offer-ride",
                    onClick: onOfferRideClick,
                },
                {
                    key: "my-rides",
                    label: labels?.myRides ?? "My rides",
                    icon: <ListIcon />,
                    active: activeTab === "my-rides",
                    onClick: onMyRidesClick,
                },
                {
                    key: "ride-requests",
                    label: labels?.rideRequests ?? "Ride requests",
                    icon: <ListChecksIcon />,
                    active: activeTab === "ride-requests",
                    onClick: onRideRequestsClick,
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
        <RoleNavbarLayout
            navRef={navbarRef}
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            logo={logoImg}
            navButtons={navButtons}
            desktopControls={<NavbarRoleControls {...roleControlsProps} />}
            compactControls={
                <>
                    {compactRoleSwitcher}
                    {profileMenu}
                </>
            }
            bottomTabs={bottomTabs}
        />
    );
}
