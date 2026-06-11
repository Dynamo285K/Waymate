import { randomUUID } from "node:crypto";
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
import { RideError, rideErrorToHttpStatus } from "./modules/rides/ride.errors";
import {
    BookingError,
    bookingErrorToHttpStatus,
} from "./modules/bookings/booking.errors";
import { startRideAutoEndWorker } from "./modules/rides/ride.auto-end";
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
import { DomainError } from "./shared/errors";
import { logger } from "./shared/logger";
import { requestMeta } from "./shared/request-meta";

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

// The client IP is taken from X-Forwarded-For. Only the entries appended by
// our own trusted reverse proxies can be trusted: a client can prefill the
// header, so everything to the left of the trusted hops is attacker-supplied.
// With `TRUSTED_PROXY_COUNT` proxies in front, the real client IP is the entry
// that many positions from the end. Returning "unknown" on a malformed or
// too-short header is safe — those requests just share a single bucket.
function getClientIp(request: Request): string {
    const xff = request.headers.get("x-forwarded-for");
    if (!xff) return "unknown";
    const hops = xff
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    return hops[hops.length - env.TRUSTED_PROXY_COUNT] ?? "unknown";
}

function shouldSkipRateLimit(path: string): boolean {
    if (!env.RATE_LIMIT_ENABLED) return true;
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
            // Let the browser read the request id we mint in `.onRequest`,
            // otherwise it strips the header from the JS-visible response and
            // the id is only useful in server-side logs.
            exposeHeaders: ["x-request-id"],
            // Cache preflights for 10 min. Without this Chrome re-preflights
            // every ~5s, so an SPA doing many credentialed PATCH/DELETE calls
            // pays an extra OPTIONS roundtrip before almost every request.
            maxAge: 600,
        })
    )
    .onRequest(async ({ request, set }) => {
        // Stash requestId + start time BEFORE any check that may throw so even
        // rejected requests (413, 429) get a request line with timing.
        const requestId = randomUUID();
        requestMeta.set(request, {
            requestId,
            startedAt: performance.now(),
        });
        set.headers["x-request-id"] = requestId;

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

        // CORS preflights are browser-generated, bodyless, and side-effect
        // free — rate-limiting them lets normal SPA usage burn the per-IP
        // quota on OPTIONS, and a 429 thrown here would also race ahead of the
        // CORS headers, surfacing to the browser as a bogus "CORS error".
        if (request.method === "OPTIONS") return;

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
    .onError(({ code, error, status, set, request }) => {
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
        if (error instanceof RideError) {
            return status(rideErrorToHttpStatus(error.code), {
                error: error.code,
            });
        }
        if (error instanceof BookingError) {
            return status(bookingErrorToHttpStatus(error.code), {
                error: error.code,
            });
        }
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "VALIDATION" });
        }
        if (code === "NOT_FOUND") {
            return status(404, { error: "NOT_FOUND" });
        }
        // Domain errors that bypassed per-module .onError handlers due to
        // Elysia's named-plugin hoisting. Surface the error code to the
        // client so frontends can map it; use 409 as a safe non-5xx status.
        if (error instanceof DomainError) {
            return status(409, { error: error.code });
        }
        const meta = requestMeta.get(request);
        logger.error(
            { err: error, requestId: meta?.requestId },
            "unhandled_error"
        );
        return status(500, { error: "INTERNAL_SERVER_ERROR" });
    })
    .onAfterResponse(({ request, set }) => {
        const meta = requestMeta.get(request);
        if (!meta) return;
        const url = new URL(request.url);
        const durationMs = Math.round(performance.now() - meta.startedAt);
        const status =
            typeof set.status === "number"
                ? set.status
                : typeof set.status === "string"
                  ? Number.parseInt(set.status, 10) || 200
                  : 200;
        logger.info(
            {
                requestId: meta.requestId,
                method: request.method,
                path: url.pathname,
                status,
                durationMs,
            },
            "request"
        );
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
                paths: ["/", "/api/auth/error", /^\/api\/auth(\/|$)/],
            },
        })
    )
    .get("/api/auth/error", ({ query, redirect }) => {
        const error = (query as Record<string, string>).error ?? "unknown";
        return redirect(
            `${env.WEB_ORIGIN}/login?error=${encodeURIComponent(error)}`,
            302
        );
    })
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
    startRideAutoEndWorker();
    logger.info(
        {
            host: server.server?.hostname,
            port: server.server?.port,
        },
        "Waymate API started"
    );
}
