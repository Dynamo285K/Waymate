import { API_BASE_URL, apiFetch } from "./api";

const AUTH_BASE_URL =
    import.meta.env.VITE_AUTH_BASE_URL?.replace(/\/$/, "") ??
    `${API_BASE_URL}/api/auth`;

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

type AuthResponse = {
    token?: string | null;
    user: AuthUser;
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

async function authFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`${AUTH_BASE_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message =
            data && typeof data.error === "string"
                ? data.error
                : data && typeof data.message === "string"
                  ? data.message
                  : getFallbackAuthError(path, response.status);
        throw new Error(message);
    }

    return data as T;
}

function getFallbackAuthError(path: string, status: number) {
    if (path === "/sign-in/social" && (status === 400 || status === 404)) {
        return "Google login is not configured on the API.";
    }

    if (status === 401) {
        return "Invalid email or password.";
    }

    if (status >= 500) {
        return "Server error. Please try again later.";
    }

    return "Request failed.";
}

export function signUpWithEmail(params: {
    name: string;
    email: string;
    password: string;
}) {
    const { firstName, lastName } = splitFullName(params.name);

    return authFetch<AuthResponse>("/sign-up/email", {
        method: "POST",
        body: JSON.stringify({
            name: params.name,
            firstName,
            lastName,
            email: params.email,
            password: params.password,
            callbackURL: `${window.location.origin}/onboarding`,
        }),
    });
}

function splitFullName(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const formatNamePart = (value: string) =>
        value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : "";

    return {
        firstName: formatNamePart(parts[0] ?? "") || undefined,
        lastName: formatNamePart(parts.slice(1).join("")) || undefined,
    };
}

export function signInWithEmail(params: { email: string; password: string }) {
    return authFetch<AuthResponse>("/sign-in/email", {
        method: "POST",
        body: JSON.stringify({
            email: params.email,
            password: params.password,
            rememberMe: true,
        }),
    });
}

export function signInWithGoogle() {
    return authFetch<{ url?: string }>("/sign-in/social", {
        method: "POST",
        body: JSON.stringify({
            provider: "google",
            callbackURL: `${window.location.origin}/onboarding`,
            newUserCallbackURL: `${window.location.origin}/onboarding`,
        }),
    });
}

export function signOut() {
    return authFetch<{ success: boolean }>("/sign-out", {
        method: "POST",
    });
}

export function getCurrentUser() {
    return apiFetch<CurrentUser>("/users/me");
}

export function updateCurrentUserProfile(params: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    bio?: string;
}) {
    return apiFetch<CurrentUser>("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify(params),
    });
}

export async function getPostAuthPath() {
    const user = await getCurrentUser();

    if (!hasCompletedOnboarding(user)) {
        return "/onboarding";
    }

    return "/passenger";
}
