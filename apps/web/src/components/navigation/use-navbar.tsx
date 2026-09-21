import { useState, useEffect, useRef } from "react";
import { MoonIcon } from "@/components/ui/icons/MoonIcon";
import { SunIcon } from "@/components/ui/icons/SunIcon";
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
    resetKey,
}: {
    breakpointWidth: number;
    theme: Theme;
    /** When this value changes the dynamic breakpoint resets to
     *  `breakpointWidth` so the desktop layout gets a fresh measurement.
     *  Typically derived from language / tab count. */
    resetKey?: string | number;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navbarRef = useRef<HTMLElement>(null);
    const [dynamicBreakpoint, setDynamicBreakpoint] = useState(breakpointWidth);

    useEffect(() => {
        setDynamicBreakpoint(breakpointWidth);
    }, [breakpointWidth, resetKey]);

    const breakpoint = useBreakpoint(dynamicBreakpoint);
    const isDesktop = breakpoint === "desktop";
    const isTablet = breakpoint === "tablet";
    const isMobile = breakpoint === "mobile";

    useEffect(() => {
        const el = navbarRef.current;
        if (!el || !isDesktop) return;

        const observer = new ResizeObserver(() => {
            if (el.scrollWidth > el.clientWidth) {
                // The navbar content needs more space than is available!
                // Dynamically raise the breakpoint to exactly what is needed + buffer.
                setDynamicBreakpoint(el.scrollWidth + 2);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [isDesktop]);

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
