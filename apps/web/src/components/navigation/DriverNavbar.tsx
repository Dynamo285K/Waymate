import {
    PlusIcon,
    ListIcon,
    ListChecksIcon,
    MessageCircleIcon,
} from "@waymate/ui";
import { type Language } from "../controls/LanguageSwitcher";
import { type Role } from "../controls/RoleSwitcher";
import { RoleNavbar, type RoleNavbarTab } from "./RoleNavbar";

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
    const tabs: RoleNavbarTab[] = [
        {
            key: "offer-ride",
            label: labels?.offerRide ?? "Offer ride",
            icon: <PlusIcon />,
            onClick: onOfferRideClick,
        },
        {
            key: "my-rides",
            label: labels?.myRides ?? "My rides",
            icon: <ListIcon />,
            onClick: onMyRidesClick,
        },
        {
            key: "ride-requests",
            label: labels?.rideRequests ?? "Ride requests",
            icon: <ListChecksIcon />,
            onClick: onRideRequestsClick,
        },
        {
            key: "chat",
            label: labels?.chat ?? "Chat",
            icon: <MessageCircleIcon />,
            onClick: onChatClick,
            badge: chatBadge,
        },
    ];

    return (
        <RoleNavbar
            tabs={tabs}
            activeKey={activeTab}
            role={role}
            onRoleChange={onRoleChange}
            roleLabels={{
                passenger: labels?.passenger,
                driver: labels?.driver,
            }}
            language={language}
            onLanguageChange={onLanguageChange}
            theme={theme}
            onThemeToggle={onThemeToggle}
            onLogoClick={onLogoClick}
            userName={userName}
            userEmail={userEmail}
            onProfileClick={onProfileClick}
            onMyRidesClick={onMyRidesClick}
            onMessagesClick={onMessagesClick}
            onRatingsClick={onRatingsClick}
            onLogoutClick={onLogoutClick}
            profileLabels={{
                profile: labels?.profile,
                myRides: labels?.dropdownMyRides,
                messages: labels?.messages,
                ratings: labels?.ratings,
                logout: labels?.logout,
            }}
        />
    );
}
