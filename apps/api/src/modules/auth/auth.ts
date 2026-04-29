import { Resend } from "resend";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { randomUUID } from "crypto";
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

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.WEB_ORIGIN],

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
            if (ctx.path !== "/sign-up/email") return;

            const email = ctx.body?.email;
            if (typeof email !== "string") return;

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
