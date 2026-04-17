import { Elysia } from "elysia";
import { auth } from "./modules/auth/auth"; // Uprav cestu podľa toho, kde máš auth.ts
import { UserRoutes } from "./modules/users/user.routes";
import { CarRoutes } from "./modules/cars/car.routes";

const app = new Elysia()
    .get("/", () => ({ status: "Waymate API is online" }))
    .mount(auth.handler)
    .use(UserRoutes)
    .use(CarRoutes)
    .listen(3000);

console.log(
    `Waymate API is running at ${app.server?.hostname}:${app.server?.port}`
);
