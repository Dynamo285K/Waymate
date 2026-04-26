import { Elysia } from "elysia";
import { env } from "./config/env";
import { auth } from "./modules/auth/auth";
import { UserRoutes } from "./modules/users/user.routes";
import { CarRoutes } from "./modules/cars/car.routes";
import { RideRoutes } from "./modules/rides/ride.routes";

const app = new Elysia()
    .get("/", () => ({ status: "Waymate API is online" }))
    .mount(auth.handler)
    .use(UserRoutes)
    .use(CarRoutes)
    .use(RideRoutes)
    .listen(env.PORT);

console.log(
    `Waymate API is running at ${app.server?.hostname}:${app.server?.port}`
);
