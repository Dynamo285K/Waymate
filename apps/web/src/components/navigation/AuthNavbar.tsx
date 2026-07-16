import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { NavButton } from "./NavButton";
import { IconButton } from "@/components/ui/IconButton";
import { LanguageSwitcher, type Language } from "../controls/LanguageSwitcher";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { MoonIcon } from "@/components/ui/icons/MoonIcon";
import { SunIcon } from "@/components/ui/icons/SunIcon";
import logoLight from "@/assets/logo_light_mode.png";
import logoDark from "@/assets/logo_dark_mode.png";

export type AuthNavbarLabels = {
    login?: string;
    register?: string;
};

export type AuthNavbarProps = {
    language: Language;
    onLanguageChange: (value: Language) => void;
    theme?: "light" | "dark";
    onThemeToggle?: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogoClick?: () => void;
    labels?: AuthNavbarLabels;
};

export function AuthNavbar({
    language,
    onLanguageChange,
    theme = "light",
    onThemeToggle,
    onLogin,
    onRegister,
    onLogoClick,
    labels,
}: AuthNavbarProps) {
    const logoSrc = theme === "dark" ? logoDark : logoLight;
    const themeIcon = theme === "dark" ? <SunIcon /> : <MoonIcon />;
    const themeLabel =
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    const hasAuthButtons = onLogin !== undefined || onRegister !== undefined;

    const logoImg = (
        <img
            src={logoSrc}
            alt="WayMate logo"
            className={`w-24 h-auto object-contain block shrink-0 ${onLogoClick ? "cursor-pointer" : "cursor-default"}`}
            onClick={onLogoClick}
        />
    );

    const authButtons = hasAuthButtons ? (
        <div className="flex items-center gap-2 shrink-0">
            <NavButton onClick={onLogin}>{labels?.login ?? "Log in"}</NavButton>
            <NavButton
                active
                onClick={onRegister}
            >
                {labels?.register ?? "Register"}
            </NavButton>
        </div>
    ) : null;

    const settingsDropdown = (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-text-secondary shadow-button hover:bg-border icon-svg:w-4 icon-svg:h-4"
                aria-label="Open settings menu"
            >
                <ChevronDownIcon />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-200 rounded-2xl border border-border bg-card p-3 shadow-dropdown-strong"
                    sideOffset={12}
                    align="end"
                    data-theme={theme}
                >
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-card shadow-button">
                            <LanguageSwitcher
                                value={language}
                                onChange={onLanguageChange}
                            />
                        </div>
                        <IconButton
                            ariaLabel={themeLabel}
                            icon={themeIcon}
                            variant="default"
                            onClick={onThemeToggle}
                        />
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );

    return (
        <header className="w-full border-b border-border bg-background">
            <div className="min-h-18 px-4 py-2.5 flex items-center justify-between gap-3 sm:px-6">
                {logoImg}
                <div className="flex items-center gap-3 min-w-0">
                    {authButtons}
                    {settingsDropdown}
                </div>
            </div>
        </header>
    );
}
