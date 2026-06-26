import { type ReactNode } from "react";
import { NavButton } from "@waymate/ui";
import { type Language } from "../controls/LanguageSwitcher";
import { RoleSwitcher, type Role } from "../controls/RoleSwitcher";
import { useNavbar, type Theme } from "./use-navbar";
import {
    NavbarLogo,
    NavbarBottomTabs,
    NavbarRoleControls,
    NavbarProfileDropdownMenu,
    RoleNavbarLayout,
    type RoleLabels,
    type ProfileDropdownLabels,
} from "./navbar-shared";

/**
 * A single primary-navigation entry, rendered identically in the desktop
 * `NavButton` row and the mobile `NavbarBottomTabs` bar. Driver and passenger
 * navbars differ only in this list, so it is the one thing they pass in.
 */
export type RoleNavbarTab = {
    key: string;
    label: string;
    icon: ReactNode;
    onClick?: () => void;
    badge?: number;
};

export type RoleNavbarProps = {
    tabs: RoleNavbarTab[];
    activeKey?: string;
    role: Role;
    onRoleChange: (value: Role) => void;
    roleLabels: RoleLabels;
    language: Language;
    onLanguageChange: (value: Language) => void;
    theme: Theme;
    onThemeToggle?: () => void;
    onLogoClick?: () => void;
    userName: string;
    userEmail: string;
    profileLabels?: ProfileDropdownLabels;
    onProfileClick?: () => void;
    onMyRidesClick?: () => void;
    onMessagesClick?: () => void;
    onRatingsClick?: () => void;
    onLogoutClick?: () => void;
};

/**
 * The role navbar shared by drivers and passengers: responsive shell, logo,
 * role switcher, language/theme controls, and the avatar profile dropdown. The
 * only per-role input is `tabs` (+ `activeKey`); both the desktop button row and
 * the mobile bottom tabs are derived from that single array.
 */
export function RoleNavbar({
    tabs,
    activeKey,
    role,
    onRoleChange,
    roleLabels,
    language,
    onLanguageChange,
    theme,
    onThemeToggle,
    onLogoClick,
    userName,
    userEmail,
    profileLabels,
    onProfileClick,
    onMyRidesClick,
    onMessagesClick,
    onRatingsClick,
    onLogoutClick,
}: RoleNavbarProps) {
    const {
        navbarRef,
        isDesktop,
        isTablet,
        isMobile,
        logoSrc,
        themeIcon,
        themeLabel,
    } = useNavbar({ breakpointWidth: 1024, theme });

    const logo = (
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
            labels={profileLabels}
        />
    );

    const navButtons = (
        <>
            {tabs.map((tab) => (
                <NavButton
                    key={tab.key}
                    icon={tab.icon}
                    active={tab.key === activeKey}
                    onClick={tab.onClick}
                >
                    {tab.badge ? (
                        <span className="inline-flex items-center gap-1.5">
                            {tab.label}
                            <span
                                className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red text-white text-badge font-semibold leading-none"
                                aria-label={`${tab.badge} unread`}
                            >
                                {tab.badge > 99 ? "99+" : tab.badge}
                            </span>
                        </span>
                    ) : (
                        tab.label
                    )}
                </NavButton>
            ))}
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
            items={tabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                icon: tab.icon,
                active: tab.key === activeKey,
                badge: tab.badge,
                onClick: tab.onClick,
            }))}
        />
    );

    return (
        <RoleNavbarLayout
            navRef={navbarRef}
            isDesktop={isDesktop}
            isTablet={isTablet}
            isMobile={isMobile}
            logo={logo}
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
