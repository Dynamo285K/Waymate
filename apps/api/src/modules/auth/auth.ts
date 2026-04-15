import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomUUID } from "crypto";
import { db } from "../../db";
import * as schema from "../../db/schema";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,

    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
        },
    }),

    advanced: {
        database: {
            generateId: () => randomUUID(),
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
        requireEmailVerification: false,
    },

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            mapProfileToUser: (profile) => {
                return {
                    firstName: profile.given_name,
                    lastName: profile.family_name,
                    displayName: profile.name?.replace(/\s+/g, "").slice(0, 15),
                    profilePhotoUrl: profile.picture,
                };
            },
        },
    },
});
