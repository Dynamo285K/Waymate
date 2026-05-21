import { Resend } from "resend";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins";
import { randomUUID } from "crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { env } from "../../config/env";
import { db } from "../../db";
import * as schema from "../../db/schema";

const resend = new Resend(env.RESEND_API_KEY);
const authEmailFrom = "onboarding@resend.dev";

async function sendAuthEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    await resend.emails.send({
        from: authEmailFrom,
        to,
        subject,
        html,
    });
}

const googleProvider =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
              google: {
                  clientId: env.GOOGLE_CLIENT_ID,
                  clientSecret: env.GOOGLE_CLIENT_SECRET,
                  mapProfileToUser: () => ({
                      name: "User",
                      image: undefined,
                  }),
              },
          }
        : {};

async function findAuthUserByEmail(email: string) {
    const [user] = await db
        .select({
            banned: schema.users.banned,
            banReason: schema.users.banReason,
            userStatus: schema.users.userStatus,
        })
        .from(schema.users)
        .where(
            and(
                eq(sql`lower(${schema.users.email})`, email.toLowerCase()),
                isNull(schema.users.deletedAt)
            )
        )
        .limit(1);

    return user ?? null;
}

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: Array.from(new Set([env.WEB_ORIGIN, ...env.CORS_ORIGINS])),

    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
            rateLimit: schema.rateLimits,
        },
    }),

    advanced: {
        database: {
            generateId: () => randomUUID(),
        },
        ipAddress: {
            ipAddressHeaders: ["x-forwarded-for"],
        },
    },

    rateLimit: {
        enabled: true,
        storage: "database",
        window: 60,
        max: 100,
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            // Sign-up triggers a Resend verification email — cap it like
            // sign-in so the endpoint can't be used to bulk-send mail.
            "/sign-up/email": { window: 60, max: 5 },
            "/forget-password": { window: 300, max: 3 },
            "/email-otp/send-verification-otp": { window: 60, max: 3 },
        },
    },

    user: {
        additionalFields: {
            firstName: { type: "string", required: false },
            lastName: { type: "string", required: false },
            displayName: { type: "string", required: false },
            phone: { type: "string", required: false },
            profilePhotoUrl: { type: "string", required: false },
        },
    },

    plugins: [
        admin({
            defaultRole: "USER",
            adminRoles: ["ADMIN"],
            // Map the plugin's `role` field to our existing Drizzle property
            // `userRole` (DB column `user_role`). The Drizzle adapter reads
            // and writes using the Drizzle property names, not SQL columns.
            schema: {
                user: {
                    fields: {
                        role: "userRole",
                    },
                },
            },
        }),
    ],

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,

        sendResetPassword: async ({ user, url }) => {
            await sendAuthEmail({
                to: user.email,
                subject: "Password reset",
                html: `<p>Click here to reset your password: <a href="${url}">Reset Password</a></p>`,
            });
        },
    },

    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendAuthEmail({
                to: user.email,
                subject: "Verify Email",
                html: `<p>Click here for verification: <a href="${url}">Verify Email</a></p>`,
            });
        },
    },

    socialProviders: googleProvider,

    hooks: {
        // With `requireEmailVerification: true` better-auth intentionally returns
        // a synthetic 200 response on duplicate sign-ups to prevent email
        // enumeration. We trade that off for a real error so the UI can show
        // "email already in use".
        before: createAuthMiddleware(async (ctx) => {
            const email = ctx.body?.email;
            if (typeof email !== "string") return;

            if (ctx.path === "/sign-in/email") {
                const user = await findAuthUserByEmail(email);
                if (user?.banned || user?.userStatus === "BANNED") {
                    throw new APIError("FORBIDDEN", {
                        code: "USER_BANNED",
                        message:
                            user.banReason ?? "This account has been banned.",
                    });
                }
                // SUSPENDED and DELETED are enforced here too — `assertUser-
                // CanUseSession` blocks them on API calls, but without this a
                // sign-in would still mint a (useless) session.
                if (user?.userStatus === "SUSPENDED") {
                    throw new APIError("FORBIDDEN", {
                        code: "USER_SUSPENDED",
                        message: "This account has been suspended.",
                    });
                }
                if (user?.userStatus === "DELETED") {
                    throw new APIError("FORBIDDEN", {
                        code: "USER_DELETED",
                        message: "This account no longer exists.",
                    });
                }
                return;
            }

            if (ctx.path !== "/sign-up/email") return;

            const existing = await ctx.context.internalAdapter.findUserByEmail(
                email.toLowerCase()
            );
            if (existing?.user) {
                throw new APIError("UNPROCESSABLE_ENTITY", {
                    code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
                    message: "User already exists. Use another email.",
                });
            }
        }),
    },
});
