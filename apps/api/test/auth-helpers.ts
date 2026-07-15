import { db } from "../src/db";
import { accounts, users } from "../src/db/schema";
import { auth } from "../src/modules/auth/auth";
import { apiRequest } from "./http";

const TEST_PASSWORD = "test-password-123";

type CreateSignInUserOptions = {
    role?: "USER" | "ADMIN";
    // When false the user has no firstName/lastName/phone, so `isFullyOnboarded`
    // routes reject them with ONBOARDING_REQUIRED.
    onboarded?: boolean;
};

/**
 * Inserts a sign-in-ready credential user: a verified email plus a
 * `credential` account row holding the hashed password, so
 * `/api/auth/sign-in/email` succeeds for it. Mirrors the better-auth account
 * shape used in auth.routes.test.ts.
 */
export async function createSignInUser(options: CreateSignInUserOptions = {}) {
    const { role = "USER", onboarded = true } = options;
    const email = `auth-${crypto.randomUUID()}@example.com`;

    // In test mode, better-auth is configured with a trivial fast hash (see
    // emailAndPassword.password in auth.ts). Use the same scheme here so
    // sign-in verification succeeds and we skip the bcrypt cost-10 overhead.
    const hashedPassword =
        process.env.NODE_ENV === "test"
            ? `__test__${TEST_PASSWORD}`
            : await (await auth.$context).password.hash(TEST_PASSWORD);

    const user = await db.transaction(async (tx) => {
        const [inserted] = await tx
            .insert(users)
            .values({
                name: "Auth Test User",
                email,
                emailVerified: true,
                userRole: role,
                firstName: onboarded ? "Auth" : null,
                lastName: onboarded ? "User" : null,
                phone: onboarded ? "+421900111222" : null,
            })
            .returning();
        if (!inserted) throw new Error("Failed to insert sign-in user");

        await tx.insert(accounts).values({
            id: crypto.randomUUID(),
            userId: inserted.id,
            accountId: inserted.id,
            providerId: "credential",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return inserted;
    });

    return { user, email, password: TEST_PASSWORD };
}

/**
 * Signs in through the real better-auth endpoint and returns a `Cookie` header
 * value carrying the session token — replay it on later requests via
 * {@link authenticatedRequest}.
 */
export async function signIn(email: string, password: string): Promise<string> {
    const response = await apiRequest("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (response.status !== 200) {
        throw new Error(
            `sign-in failed (${response.status}): ${await response.text()}`
        );
    }
    const setCookies = response.headers.getSetCookie();
    if (setCookies.length === 0) {
        throw new Error("sign-in returned no Set-Cookie header");
    }
    // Keep only the `name=value` part of each Set-Cookie, drop the attributes.
    return setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

/** Issues an apiRequest carrying the session cookie returned by {@link signIn}. */
export function authenticatedRequest(
    path: string,
    cookie: string,
    init: RequestInit = {}
): Promise<Response> {
    return apiRequest(path, {
        ...init,
        headers: { ...init.headers, cookie },
    });
}

/**
 * Creates a credential user and signs them in, returning the user object,
 * credentials, and the session cookie string in one go.
 */
export async function createSignedInUser(options?: CreateSignInUserOptions) {
    const credentials = await createSignInUser(options);
    const cookie = await signIn(credentials.email, credentials.password);
    return { ...credentials, cookie };
}
