import "dotenv/config";
import { z } from "zod";

const OriginListSchema = z
    .string()
    .optional()
    .transform((value) =>
        value
            ? value
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter((entry) => entry.length > 0)
            : []
    )
    .pipe(z.array(z.url()));

const EnvSchema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    WEB_ORIGIN: z.url().default("http://localhost:5173"),
    CORS_ORIGINS: OriginListSchema,
    RESEND_API_KEY: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(z.prettifyError(parsed.error));
    throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
