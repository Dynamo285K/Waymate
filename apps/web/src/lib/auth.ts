import { api } from "./eden";
import { unwrap } from "./eden-query";
import { authClient } from "./auth-client";

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    bio?: string | null;
    createdAt?: string | Date;
};

export type CurrentUser = AuthUser & {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    displayName: string | null;
    bio: string | null;
    createdAt: string | Date;
};

export function hasCompletedOnboarding(
    user: Pick<CurrentUser, "firstName" | "lastName" | "phone">
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

export async function getCurrentUser() {
    return (await unwrap(api.users.me.get())) as CurrentUser;
}

export async function updateCurrentUserProfile(params: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    bio?: string;
}) {
    return (await unwrap(api.users.me.profile.patch(params))) as CurrentUser;
}

export async function getPostAuthPath() {
    const user = await getCurrentUser();

    if (!hasCompletedOnboarding(user)) {
        return "/onboarding";
    }

    return "/passenger";
}
