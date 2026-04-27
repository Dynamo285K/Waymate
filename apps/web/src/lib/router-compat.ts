import {
    useNavigate as useTanstackNavigate,
    useLocation as useTanstackLocation,
    useRouterState,
} from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

/**
 * Drop-in replacement for `react-router-dom` v7's hook API on top of
 * TanStack Router. Lets the page components stay unchanged during the
 * router migration. New code should use TanStack Router APIs directly.
 */

type NavigateOptions = { state?: unknown; replace?: boolean };
type To = string | number;

export function useNavigate(): (to: To, options?: NavigateOptions) => void {
    const navigate = useTanstackNavigate();
    return useCallback(
        (to, options) => {
            if (typeof to === "number") {
                window.history.go(to);
                return;
            }
            navigate({
                to,
                state: (options?.state ?? undefined) as never,
                replace: options?.replace,
            });
        },
        [navigate]
    );
}

export function useLocation(): {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
} {
    const location = useTanstackLocation();
    return {
        pathname: location.pathname,
        search: location.searchStr ?? "",
        hash: location.hash ?? "",
        state: location.state,
    };
}

export function useSearchParams(): [
    URLSearchParams,
    (next: URLSearchParams | Record<string, string>) => void,
] {
    const searchStr = useRouterState({
        select: (s) => s.location.searchStr ?? "",
    });
    const navigate = useTanstackNavigate();

    const params = useMemo(() => new URLSearchParams(searchStr), [searchStr]);

    const setParams = useCallback(
        (next: URLSearchParams | Record<string, string>) => {
            const nextParams =
                next instanceof URLSearchParams
                    ? next
                    : new URLSearchParams(next);
            const search: Record<string, string> = {};
            nextParams.forEach((value, key) => {
                search[key] = value;
            });
            navigate({ to: ".", search: search as never });
        },
        [navigate]
    );

    return [params, setParams];
}
