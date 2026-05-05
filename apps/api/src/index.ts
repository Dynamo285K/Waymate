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
import { AdminRoutes } from "./modules/admin/admin.routes";

const allowedOrigins = Array.from(
    new Set([env.WEB_ORIGIN, ...env.CORS_ORIGINS])
);

export const app = new Elysia()
    .use(
        cors({
            origin: allowedOrigins,
            credentials: true,
            methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    )
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
    .use(AdminRoutes);

export type App = typeof app;
export type Auth = typeof auth;

if (import.meta.main) {
    const server = app.listen(env.PORT);
    console.log(
        `Waymate API is running at ${server.server?.hostname}:${server.server?.port}`
    );
}
