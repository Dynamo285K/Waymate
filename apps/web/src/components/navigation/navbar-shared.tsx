import { type ReactNode, type RefObject } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    Avatar,
    Button,
    IconButton,
    ChevronDownIcon,
    ProfileDropdown,
} from "@waymate/ui";
import { LanguageSwitcher, type Language } from "../controls/LanguageSwitcher";
import { RoleSwitcher, type Role } from "../controls/RoleSwitcher";
import type { Theme } from "./use-navbar";

export type RoleLabels = {
    passenger?: string;
    driver?: string;
};

export type NavbarBottomTabItem = {
    key: string;
    label: string;
    icon: ReactNode;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
};

export function NavbarShell({
    navRef,
    children,
}: {
    navRef: RefObject<HTMLElement | null>;
    children: ReactNode;
}) {
    return (
        <header
            className="sticky top-0 z-100 w-full bg-background border-b border-border shadow-dropdown-strong"
            ref={navRef}
        >
            {children}
        </header>
    );
}

export function NavbarLogo({
    logoSrc,
    onLogoClick,
}: {
    logoSrc: string;
    onLogoClick?: () => void;
}) {
    return (
        <img
            src={logoSrc}
            alt="WayMate logo"
            className={`w-24 h-auto object-contain block shrink-0 ${onLogoClick ? "cursor-pointer" : "cursor-default"}`}
            onClick={onLogoClick}
        />
    );
}

export function NavbarHamburger({
    open,
    onToggle,
}: {
    open: boolean;
    onToggle: () => void;
}) {
    return (
        <Button
            variant="unstyled"
            type="button"
            className="bg-card border border-border rounded-control w-10 h-10 cursor-pointer flex flex-col items-center justify-center gap-1.25 p-0 shadow-hairline menu-line:block menu-line:w-4.5 menu-line:h-0.5 menu-line:bg-text-primary menu-line:rounded-sm"
            onClick={onToggle}
            aria-label="Open menu"
            aria-expanded={open}
        >
            <span />
            <span />
            <span />
        </Button>
    );
}

/**
 * The avatar + chevron trigger and its dropdown surface. The actual menu body
 * differs by role (`ProfileDropdown` vs `AdminProfileDropdown`), so it is
 * passed in as children.
 */
export function NavbarProfileMenu({
    userName,
    theme,
    children,
}: {
    userName: string;
    theme: Theme;
    children: ReactNode;
}) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="inline-flex items-center gap-2 border-0 bg-transparent p-0 cursor-pointer group"
                aria-label="Open profile menu"
            >
                <Avatar
                    name={userName}
                    size="sm"
                />
                <span className="w-8 h-8 rounded-full bg-card text-text-secondary shadow-button inline-flex items-center justify-center group-hover:bg-border icon-svg:w-4 icon-svg:h-4">
                    <ChevronDownIcon />
                </span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-200"
                    sideOffset={16}
                    align="end"
                    data-theme={theme}
                >
                    {children}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

export function NavbarBottomTabs({
    items,
    ariaLabel = "Primary navigation",
}: {
    items: NavbarBottomTabItem[];
    ariaLabel?: string;
}) {
    return (
        <nav
            className="fixed left-0 right-0 bottom-0 z-1000 bg-card/95 border-t border-border shadow-dropdown-strong backdrop-blur pb-2"
            aria-label={ariaLabel}
        >
            <div
                className="grid min-h-16 px-2 pt-1.5"
                style={{
                    gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                }}
            >
                {items.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 text-caption font-semibold leading-none transition-colors duration-150 ${
                            item.active
                                ? "text-primary"
                                : "text-text-secondary hover:text-text-primary"
                        }`}
                        aria-current={item.active ? "page" : undefined}
                        onClick={item.onClick}
                    >
                        <span
                            className={`relative inline-flex h-8 min-w-11 items-center justify-center rounded-full transition-colors duration-150 icon-svg:h-5 icon-svg:w-5 ${
                                item.active
                                    ? "bg-primary-tint text-primary"
                                    : "bg-transparent"
                            }`}
                        >
                            {item.icon}
                            {item.badge ? (
                                <span
                                    className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-badge font-bold leading-none text-white"
                                    aria-label={`${item.badge} unread`}
                                >
                                    {item.badge > 99 ? "99+" : item.badge}
                                </span>
                            ) : null}
                        </span>
                        <span className="max-w-full truncate">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

export function NavbarProfileSettings({
    language,
    onLanguageChange,
    themeLabel,
    themeIcon,
    onThemeToggle,
}: {
    language: Language;
    onLanguageChange: (value: Language) => void;
    themeLabel: string;
    themeIcon: ReactNode;
    onThemeToggle?: () => void;
}) {
    return (
        <div className="border-t border-border py-3 px-4 flex items-center justify-between gap-3">
            <div className="rounded-full bg-card shadow-control-floating">
                <LanguageSwitcher
                    value={language}
                    onChange={onLanguageChange}
                />
            </div>
            <div className="inline-flex rounded-full bg-card shadow-control-floating">
                <IconButton
                    ariaLabel={themeLabel}
                    icon={themeIcon}
                    variant="default"
                    onClick={onThemeToggle}
                />
            </div>
        </div>
    );
}

/** Theme toggle + language switcher + profile menu, in that row order. */
export function NavbarControlsRow({
    language,
    onLanguageChange,
    themeLabel,
    themeIcon,
    onThemeToggle,
    profileMenu,
}: {
    language: Language;
    onLanguageChange: (value: Language) => void;
    themeLabel: string;
    themeIcon: ReactNode;
    onThemeToggle?: () => void;
    profileMenu: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="inline-flex rounded-full bg-card shadow-control-floating">
                <IconButton
                    ariaLabel={themeLabel}
                    icon={themeIcon}
                    variant="default"
                    onClick={onThemeToggle}
                />
            </div>
            <div className="rounded-full bg-card shadow-control-floating">
                <LanguageSwitcher
                    value={language}
                    onChange={onLanguageChange}
                />
            </div>
            <div className="ml-auto">{profileMenu}</div>
        </div>
    );
}

type RoleControlsProps = {
    role: Role;
    onRoleChange: (value: Role) => void;
    roleLabels: RoleLabels;
    language: Language;
    onLanguageChange: (value: Language) => void;
    themeLabel: string;
    themeIcon: ReactNode;
    onThemeToggle?: () => void;
    profileMenu: ReactNode;
};

/** Desktop right-hand cluster shared by the passenger and driver navbars. */
export function NavbarRoleControls({
    role,
    onRoleChange,
    roleLabels,
    language,
    onLanguageChange,
    themeLabel,
    themeIcon,
    onThemeToggle,
    profileMenu,
}: RoleControlsProps) {
    return (
        <>
            <RoleSwitcher
                value={role}
                onChange={onRoleChange}
                labels={roleLabels}
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
}

export type ProfileDropdownLabels = {
    profile?: string;
    myRides?: string;
    messages?: string;
    ratings?: string;
    logout?: string;
};

type ProfileSettingsProps = {
    language: Language;
    onLanguageChange: (value: Language) => void;
    themeLabel: string;
    themeIcon: ReactNode;
    onThemeToggle?: () => void;
};

/**
 * The avatar-triggered dropdown card — trigger + framed surface + the
 * language/theme settings footer — shared by all three navbars. The dropdown
 * body (role-specific `ProfileDropdown` vs `AdminProfileDropdown`) is passed in
 * as children.
 */
export function NavbarProfileSurface({
    userName,
    theme,
    children,
    ...settings
}: {
    userName: string;
    theme: Theme;
    children: ReactNode;
} & ProfileSettingsProps) {
    return (
        <NavbarProfileMenu
            userName={userName}
            theme={theme}
        >
            <div className="w-80 rounded-summary-card overflow-hidden bg-card border border-border shadow-dropdown-strong">
                <div className="profile-dropdown-surface:w-full profile-dropdown-surface:rounded-none profile-dropdown-surface:border-0 profile-dropdown-surface:shadow-none">
                    {children}
                </div>
                <NavbarProfileSettings {...settings} />
            </div>
        </NavbarProfileMenu>
    );
}

/**
 * The full avatar-triggered profile dropdown — the ProfileDropdown body plus the
 * language/theme settings footer — shared verbatim by the passenger and driver
 * navbars. Callers map their own label keys onto `labels` before passing them.
 */
export function NavbarProfileDropdownMenu({
    userName,
    userEmail,
    theme,
    onProfileClick,
    onMyRidesClick,
    onMessagesClick,
    onRatingsClick,
    onLogoutClick,
    labels,
    ...settings
}: {
    userName: string;
    userEmail: string;
    theme: Theme;
    onProfileClick?: () => void;
    onMyRidesClick?: () => void;
    onMessagesClick?: () => void;
    onRatingsClick?: () => void;
    onLogoutClick?: () => void;
    labels?: ProfileDropdownLabels;
} & ProfileSettingsProps) {
    return (
        <NavbarProfileSurface
            userName={userName}
            theme={theme}
            {...settings}
        >
            <ProfileDropdown
                name={userName}
                email={userEmail}
                onProfileClick={onProfileClick}
                onMyRidesClick={onMyRidesClick}
                onMessagesClick={onMessagesClick}
                onRatingsClick={onRatingsClick}
                onLogoutClick={onLogoutClick}
                labels={labels}
            />
        </NavbarProfileSurface>
    );
}

/**
 * The responsive shell (desktop row / tablet row / mobile stack + bottom tabs)
 * shared by the passenger and driver navbars. The role-specific pieces are
 * passed in as nodes; `compactControls` is the role-switcher + profile-menu
 * cluster rendered on tablet and mobile.
 */
export function RoleNavbarLayout({
    navRef,
    isDesktop,
    isTablet,
    isMobile,
    logo,
    navButtons,
    desktopControls,
    compactControls,
    bottomTabs,
}: {
    navRef: RefObject<HTMLElement | null>;
    isDesktop: boolean;
    isTablet: boolean;
    isMobile: boolean;
    logo: ReactNode;
    navButtons: ReactNode;
    desktopControls: ReactNode;
    compactControls: ReactNode;
    bottomTabs: ReactNode;
}) {
    return (
        <NavbarShell navRef={navRef}>
            {isDesktop && (
                <div className="min-h-18 px-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 min-w-0">
                        {logo}
                        <nav
                            className="flex items-center gap-5 flex-wrap"
                            aria-label="Primary navigation"
                        >
                            {navButtons}
                        </nav>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                        {desktopControls}
                    </div>
                </div>
            )}
            {isTablet && (
                <div className="min-h-16 px-4 flex items-center justify-between gap-4">
                    {logo}
                    <div className="flex items-center gap-4 shrink-0">
                        {compactControls}
                    </div>
                    {bottomTabs}
                </div>
            )}
            {isMobile && (
                <div className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">{logo}</div>
                        <div className="flex items-center gap-3 shrink-0">
                            {compactControls}
                        </div>
                    </div>
                    {bottomTabs}
                </div>
            )}
        </NavbarShell>
    );
}

/** Expanded tablet/mobile menu panel shared by the passenger and driver navbars. */
export function NavbarRolePanel({
    role,
    onRoleChange,
    roleLabels,
    language,
    onLanguageChange,
    themeLabel,
    themeIcon,
    onThemeToggle,
    profileMenu,
}: RoleControlsProps) {
    return (
        <>
            <RoleSwitcher
                value={role}
                onChange={onRoleChange}
                className="self-start shrink-0"
                size="sm"
                labels={roleLabels}
            />
            <NavbarControlsRow
                language={language}
                onLanguageChange={onLanguageChange}
                themeLabel={themeLabel}
                themeIcon={themeIcon}
                onThemeToggle={onThemeToggle}
                profileMenu={profileMenu}
            />
        </>
    );
}
