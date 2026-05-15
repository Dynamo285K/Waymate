import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import * as z from "zod";
import { env } from "./config/env";
import { openApiifyJsonSchema } from "./openapi/post-process";
import { auth } from "./modules/auth/auth";
import { HealthRoutes } from "./modules/health/health.routes";
import { UserRoutes } from "./modules/users/user.routes";
import { CarRoutes } from "./modules/cars/car.routes";
import { RideRoutes } from "./modules/rides/ride.routes";
import { BookingRoutes } from "./modules/bookings/booking.routes";
import { ReviewRoutes } from "./modules/reviews/review.routes";
import { ReportRoutes } from "./modules/reports/report.routes";
import { AdminRoutes } from "./modules/admin/admin.routes";
import { checkRateLimit } from "./shared/rate-limit";
import {
    RateLimitError,
    RequestError,
    RequestErrorCodes,
    requestErrorToHttpStatus,
} from "./shared/request-errors";
import { AuthError, authErrorToHttpStatus } from "./modules/auth/auth.errors";

const allowedOrigins = Array.from(
    new Set([env.WEB_ORIGIN, ...env.CORS_ORIGINS])
);

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD", "OPTIONS"]);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_GLOBAL_MAX = 60;

type RateLimitRule = {
    match: (method: string, path: string, search: URLSearchParams) => boolean;
    keyPrefix: string;
    max: number;
};

// Stricter per-route caps layered on top of the global default. Both checks
// run, so a client that sits under the route-specific cap still has to
// respect the global one.
const RATE_LIMIT_RULES: RateLimitRule[] = [
    {
        match: (method, path) =>
            method === "POST" && (path === "/rides" || path === "/rides/"),
        keyPrefix: "rl:rides:create",
        max: 10,
    },
    {
        match: (method, path) =>
            method === "POST" &&
            (path === "/bookings" || path === "/bookings/"),
        keyPrefix: "rl:bookings:create",
        max: 20,
    },
    {
        match: (method, path) =>
            method === "POST" && (path === "/reports" || path === "/reports/"),
        keyPrefix: "rl:reports:create",
        max: 10,
    },
    {
        match: (method, path) =>
            method === "PATCH" && /^\/admin\/users\/[^/]+\/status$/.test(path),
        keyPrefix: "rl:admin:user-status",
        max: 30,
    },
    {
        match: (method, path) =>
            method === "PATCH" && /^\/admin\/rides\/[^/]+\/cancel$/.test(path),
        keyPrefix: "rl:admin:ride-cancel",
        max: 30,
    },
    {
        match: (method, path) =>
            method === "PATCH" &&
            /^\/admin\/reviews\/[^/]+\/status$/.test(path),
        keyPrefix: "rl:admin:review-status",
        max: 30,
    },
    {
        match: (method, path) =>
            method === "PATCH" &&
            /^\/admin\/reports\/[^/]+\/status$/.test(path),
        keyPrefix: "rl:admin:report-status",
        max: 30,
    },
    {
        match: (method, path, search) =>
            method === "GET" && path === "/admin/users" && search.has("search"),
        keyPrefix: "rl:admin:users-search",
        max: 30,
    },
];

function getClientIp(request: Request): string {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }
    return "unknown";
}

function shouldSkipRateLimit(path: string): boolean {
    if (path === "/health") return true;
    if (path === "/api/auth" || path.startsWith("/api/auth/")) return true;
    if (path === "/openapi" || path.startsWith("/openapi/")) return true;
    return false;
}

export const app = new Elysia()
    .use(
        cors({
            origin: allowedOrigins,
            credentials: true,
            methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    )
    .onRequest(async ({ request }) => {
        if (!METHODS_WITHOUT_BODY.has(request.method)) {
            const header = request.headers.get("content-length");
            if (header !== null) {
                const bytes = Number.parseInt(header, 10);
                if (
                    Number.isFinite(bytes) &&
                    bytes > env.MAX_REQUEST_BODY_BYTES
                ) {
                    throw new RequestError(RequestErrorCodes.PayloadTooLarge);
                }
            }
        }

        const url = new URL(request.url);
        if (shouldSkipRateLimit(url.pathname)) return;

        const ip = getClientIp(request);

        await checkRateLimit(
            `rl:global:${ip}`,
            RATE_LIMIT_GLOBAL_MAX,
            RATE_LIMIT_WINDOW_MS
        );

        const rule = RATE_LIMIT_RULES.find((r) =>
            r.match(request.method, url.pathname, url.searchParams)
        );
        if (rule) {
            await checkRateLimit(
                `${rule.keyPrefix}:${ip}`,
                rule.max,
                RATE_LIMIT_WINDOW_MS
            );
        }
    })
    .onError(({ code, error, status, set }) => {
        if (error instanceof RateLimitError) {
            set.headers["retry-after"] = String(error.retryAfterSeconds);
            return status(429, { error: error.code });
        }
        if (error instanceof RequestError) {
            return status(requestErrorToHttpStatus(error.code), {
                error: error.code,
            });
        }
        // AuthError is thrown by globally-registered macros (`isAuthenticated`,
        // `requireAdmin`, …). Because those plugins carry a `name`, Elysia
        // hoists their resolve callbacks to the app scope, which means errors
        // bypass per-module `.onError` handlers and land here. Map them to the
        // same 401/403 shape the modules would have produced.
        if (error instanceof AuthError) {
            return status(authErrorToHttpStatus(error.code), {
                error: error.code,
            });
        }
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "VALIDATION" });
        }
        if (code === "NOT_FOUND") {
            return status(404, { error: "NOT_FOUND" });
        }
        console.error(error);
        return status(500, { error: "INTERNAL_SERVER_ERROR" });
    })
    .use(
        openapi({
            path: "/openapi",
            mapJsonSchema: {
                zod: (schema: z.ZodType) => {
                    const json = z.toJSONSchema(schema, {
                        target: "draft-7",
                        unrepresentable: "any",
                        override: (ctx) => {
                            if (ctx.zodSchema._zod.def.type === "date") {
                                ctx.jsonSchema.type = "string";
                                ctx.jsonSchema.format = "date-time";
                            }
                        },
                    });
                    return openApiifyJsonSchema(json);
                },
            },
            documentation: {
                info: {
                    title: "Waymate API",
                    description:
                        "Carpooling backend powering the Waymate web app.",
                    version: "0.1.0",
                },
            },
            exclude: {
                paths: ["/", /^\/api\/auth(\/|$)/],
            },
        })
    )
    .mount(auth.handler)
    .use(HealthRoutes)
    .use(UserRoutes)
    .use(CarRoutes)
    .use(RideRoutes)
    .use(BookingRoutes)
    .use(ReviewRoutes)
    .use(ReportRoutes)
    .use(AdminRoutes);

export type App = typeof app;
export type Auth = typeof auth;

if (import.meta.main) {
    const server = app.listen(env.PORT);
    console.log(
        `Waymate API is running at ${server.server?.hostname}:${server.server?.port}`
    );
}
