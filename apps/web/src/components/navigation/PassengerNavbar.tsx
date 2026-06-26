import { ListIcon, MessageCircleIcon, SearchIcon } from "@waymate/ui";
import { type Language } from "../controls/LanguageSwitcher";
import { type Role } from "../controls/RoleSwitcher";
import { RoleNavbar, type RoleNavbarTab } from "./RoleNavbar";

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
    const tabs: RoleNavbarTab[] = [
        {
            key: "find-ride",
            label: labels?.findRide ?? "Find ride",
            icon: <SearchIcon />,
            onClick: onFindRideClick,
        },
        {
            key: "my-rides",
            label: labels?.myRides ?? "My rides",
            icon: <ListIcon />,
            onClick: onMyRidesClick,
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
            roleLabels={{ passenger: labels?.passenger, driver: labels?.driver }}
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
