import "dotenv/config";
import { z } from "zod";

// A bare origin: scheme + host + optional port. Reject anything with a path,
// query, or fragment so a misconfiguration like `WEB_ORIGIN=https://app.com/foo`
// fails loud instead of silently breaking CORS comparisons (browsers send
// `Origin: https://app.com` with no path). Also normalizes `https://app.com/`
// to `https://app.com` for exact-match equality.
const OriginSchema = z
    .string()
    .refine(
        (value) => {
            let url: URL;
            try {
                url = new URL(value);
            } catch {
                return false;
            }
            return (
                (url.protocol === "http:" || url.protocol === "https:") &&
                (url.pathname === "/" || url.pathname === "") &&
                url.search === "" &&
                url.hash === ""
            );
        },
        {
            message:
                "Must be a bare http(s) origin (scheme + host + optional port), without a path, query, or fragment",
        }
    )
    .transform((value) => {
        const url = new URL(value);
        return `${url.protocol}//${url.host}`;
    });

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
    .pipe(z.array(OriginSchema));

const BooleanEnvSchema = z
    .enum(["true", "false", "1", "0"])
    .default("true")
    .transform((value) => value === "true" || value === "1");

const EnvSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    WEB_ORIGIN: OriginSchema,
    CORS_ORIGINS: OriginListSchema,
    MAX_REQUEST_BODY_BYTES: z.coerce
        .number()
        .int()
        .min(1)
        .default(100 * 1024),
    // Number of trusted reverse proxies in front of the API. The client IP is
    // read that many entries from the end of `X-Forwarded-For`; entries further
    // left are attacker-controlled and must never key the rate limiter.
    TRUSTED_PROXY_COUNT: z.coerce.number().int().min(1).default(1),
    LOG_LEVEL: z
        .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
        .default("info"),
    RIDE_AUTO_END_ENABLED: BooleanEnvSchema,
    RIDE_AUTO_END_INTERVAL_MS: z.coerce
        .number()
        .int()
        .min(1_000)
        .default(60_000),
    RIDE_AUTO_END_BATCH_SIZE: z.coerce
        .number()
        .int()
        .min(1)
        .max(500)
        .default(50),
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
