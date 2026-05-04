import {
    getGetUsersMeQueryKey,
    getUsersMe,
    patchUsersMeProfile,
} from "../api-client/users/users";
import type { User } from "../api-client/model/user";
import { authClient } from "./auth-client";
import { ApiError } from "./api-fetcher";

// Single source of truth for the React Query key for the current user.
// Re-exported from auth.ts so call sites don't need to know it's orval-derived.
export const CURRENT_USER_QUERY_KEY = getGetUsersMeQueryKey();

export function hasCompletedOnboarding(
    user: Pick<User, "firstName" | "lastName" | "phone">
) {
    return Boolean(
        user.firstName?.trim() && user.lastName?.trim() && user.phone?.trim()
    );
}

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
    });
}

export function signOut() {
    return authClient.signOut();
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

export function getCurrentUser() {
    return getUsersMe();
}

// Variant for callers that treat unauthenticated as "no user" instead of an
// error (route guards, layout state). Anything other than a 401 still throws.
export async function getCurrentUserOrNull(): Promise<User | null> {
    try {
        return await getCurrentUser();
    } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
    }
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

export async function getPostAuthPath() {
    const user = await getCurrentUser();

    if (!hasCompletedOnboarding(user)) {
        return "/onboarding";
    }
    if (user.userRole === "ADMIN") {
        return "/admin";
    }

    return "/passenger";
}
