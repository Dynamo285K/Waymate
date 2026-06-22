import { type ReactNode, type RefObject } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar, Button, IconButton, ChevronDownIcon } from "@waymate/ui";
import { LanguageSwitcher, type Language } from "../controls/LanguageSwitcher";
import { RoleSwitcher, type Role } from "../controls/RoleSwitcher";
import type { Theme } from "./use-navbar";

export type RoleLabels = {
    passenger?: string;
    driver?: string;
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
            className="w-full bg-background border-b border-border shadow-navbar"
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
                    sideOffset={12}
                    align="end"
                    data-theme={theme}
                >
                    {children}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
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
