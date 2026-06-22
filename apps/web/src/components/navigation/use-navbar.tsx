import { useState, useEffect, useRef } from "react";
import { MoonIcon, SunIcon } from "@waymate/ui";
import { useBreakpoint } from "../../hooks/shared/useBreakpoint";
import logoLight from "../../assets/logo_light_mode.png";
import logoDark from "../../assets/logo_dark_mode.png";

export type Theme = "light" | "dark";

/**
 * Shared chrome for every role navbar: the mobile-menu open state, the
 * outside-click / Escape close behaviour, the responsive breakpoint flags, and
 * the theme-derived logo/icon/label. The only per-navbar input is the
 * desktop/tablet breakpoint width (admin collapses later than the others).
 */
export function useNavbar({
    breakpointWidth,
    theme,
}: {
    breakpointWidth: number;
    theme: Theme;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navbarRef = useRef<HTMLElement>(null);

    const breakpoint = useBreakpoint(breakpointWidth);
    const isDesktop = breakpoint === "desktop";
    const isTablet = breakpoint === "tablet";
    const isMobile = breakpoint === "mobile";

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                navbarRef.current &&
                !navbarRef.current.contains(e.target as Node)
            )
                setIsMobileMenuOpen(false);
        }
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") setIsMobileMenuOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const logoSrc = theme === "dark" ? logoDark : logoLight;
    const themeIcon = theme === "dark" ? <SunIcon /> : <MoonIcon />;
    const themeLabel =
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

    return {
        navbarRef,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isDesktop,
        isTablet,
        isMobile,
        logoSrc,
        themeIcon,
        themeLabel,
    };
}
