import { useEffect, useState } from "react";

export type Breakpoint = "desktop" | "tablet" | "mobile";

function computeBreakpoint(
    width: number,
    desktopMin: number,
    mobileMax: number
): Breakpoint {
    if (width > desktopMin) return "desktop";
    if (width <= mobileMax) return "mobile";
    return "tablet";
}

/**
 * The current responsive bucket, recomputed on window resize.
 *
 * Stores the *bucket* rather than the raw width on purpose: React bails out of
 * a state update whose next value is `Object.is`-equal to the current one, so
 * the resize listener only triggers a re-render when the layout actually
 * crosses a threshold — not on every pixel of a drag.
 *
 * @param desktopMin width (px) above which the layout is "desktop"
 * @param mobileMax  width (px) at or below which the layout is "mobile"
 */
export function useBreakpoint(
    desktopMin: number,
    mobileMax = 560
): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
        computeBreakpoint(
            typeof window !== "undefined" ? window.innerWidth : 1280,
            desktopMin,
            mobileMax
        )
    );

    useEffect(() => {
        function handleResize() {
            setBreakpoint(
                computeBreakpoint(window.innerWidth, desktopMin, mobileMax)
            );
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [desktopMin, mobileMax]);

    return breakpoint;
}
