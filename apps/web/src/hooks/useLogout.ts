import { signOut } from "../lib/auth";

// Full-page redirect (not SPA navigate) so every React Query cache entry,
// in-memory user state, and TanStack Router preload is wiped — the next
// route load starts against a cookieless request. `replace` (not `assign`)
// keeps the post-login page out of browser history, so Back doesn't bounce
// the user to a now-unauthenticated admin route.
export function useLogout() {
    return async () => {
        await signOut();
        window.location.replace("/login");
    };
}
