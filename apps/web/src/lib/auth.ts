import { patchUsersMeProfile } from "../api-client/users/users";
import { authClient } from "./auth-client";
import { hasCompletedOnboarding } from "./route-guards";

export function signUpWithEmail(params: { email: string; password: string }) {
    return authClient.signUp.email({
        name: "User",
        email: params.email,
        password: params.password,
        callbackURL: `${window.location.origin}/onboarding`,
    });
}

export function signInWithEmail(params: { email: string; password: string }) {
    return authClient.signIn.email({
        email: params.email,
        password: params.password,
        rememberMe: true,
    });
}

export function signInWithGoogle() {
    return authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/onboarding`,
        newUserCallbackURL: `${window.location.origin}/onboarding`,
        errorCallbackURL: `${window.location.origin}/login?error=banned`,
    });
}

// better-auth's signOut returns Promise<{ data, error }> — it resolves even
// when the server rejected the request (e.g. CSRF / Origin mismatch / rate
// limit). Surfaced as a thrown error here so callers can't accidentally
// proceed past a failed sign-out and leave the session alive.
export async function signOut() {
    const { error } = await authClient.signOut();
    if (error) {
        throw new Error(
            `Sign-out failed: ${error.message ?? error.code ?? "unknown"}`
        );
    }
}

export function requestPasswordReset(params: { email: string }) {
    return authClient.requestPasswordReset({
        email: params.email,
        redirectTo: `${window.location.origin}/forgot-password`,
    });
}

export function resetPassword(params: { token: string; newPassword: string }) {
    return authClient.resetPassword({
        token: params.token,
        newPassword: params.newPassword,
    });
}

export function updateCurrentUserProfile(params: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    bio?: string;
}) {
    return patchUsersMeProfile(params);
}

export async function getPostAuthPath(): Promise<
    "/onboarding" | "/admin" | "/passenger"
> {
    const { data: session } = await authClient.getSession();
    const user = session?.user;

    if (!user || !hasCompletedOnboarding(user)) {
        return "/onboarding";
    }
    if (user.role === "ADMIN") {
        return "/admin";
    }

    return "/passenger";
}
