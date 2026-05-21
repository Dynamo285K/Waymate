import globalSetup from "./global-setup";

await globalSetup();

const { env } = await import("../apps/api/src/config/env");
const { app } = await import("../apps/api/src/index");

const server = app.listen(env.PORT);
console.log(`E2E API started on ${server.server?.port ?? env.PORT}`);
