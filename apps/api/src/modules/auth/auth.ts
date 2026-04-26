import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { db } from "../../db";
import * as schema from "../../db/schema";

const googleProvider =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
              google: {
                  clientId: env.GOOGLE_CLIENT_ID,
                  clientSecret: env.GOOGLE_CLIENT_SECRET,
                  mapProfileToUser: (profile: {
                      given_name?: string;
                      family_name?: string;
                      name?: string;
                      picture?: string;
                  }) => ({
                      firstName: profile.given_name,
                      lastName: profile.family_name,
                      displayName: profile.name
                          ?.replace(/\s+/g, "")
                          .slice(0, 15),
                      profilePhotoUrl: profile.picture,
                  }),
              },
          }
        : {};

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,

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

    socialProviders: googleProvider,
});
