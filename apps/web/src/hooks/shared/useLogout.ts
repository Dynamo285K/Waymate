import { signOut } from "../../lib/auth";

// Full-page redirect (not SPA navigate) so every React Query cache entry,
// in-memory user state, and TanStack Router preload is wiped — the next
// route load starts against a cookieless request. `replace` (not `assign`)
// keeps the post-login page out of browser history, so Back doesn't bounce
// the user to a now-unauthenticated admin route.
export function useLogout() {
    return async () => {
        try {
            await signOut();
        } catch (err) {
            // Server-side sign-out failed (rate limit, CSRF, network blip).
            // We can't safely keep the user on an authenticated screen — the
            // session may or may not still be alive — so log loudly and
            // press on with the redirect. The next /login load runs the
            // route guard against the live server, which is the source of
            // truth for whether the user is really signed out.
            console.error("Logout: signOut failed, continuing redirect:", err);
        }
        window.location.replace("/login");
    };
}
