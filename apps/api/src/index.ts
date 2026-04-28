import { Elysia } from "elysia";
import { env } from "./config/env";
import { auth } from "./modules/auth/auth";
import { UserRoutes } from "./modules/users/user.routes";
import { CarRoutes } from "./modules/cars/car.routes";
import { RideRoutes } from "./modules/rides/ride.routes";
import { BookingRoutes } from "./modules/bookings/booking.routes";
import { ReviewRoutes } from "./modules/reviews/review.routes";

export const app = new Elysia()
    .get("/", () => ({ status: "Waymate API is online" }))
    .mount(auth.handler)
    .use(UserRoutes)
    .use(CarRoutes)
    .use(RideRoutes)
    .use(BookingRoutes)
    .use(ReviewRoutes);

export type App = typeof app;
export type Auth = typeof auth;

const server = app.listen(env.PORT);

console.log(
    `Waymate API is running at ${server.server?.hostname}:${server.server?.port}`
);
