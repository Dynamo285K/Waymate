import { defineConfig } from "drizzle-kit";

const env = typeof Bun !== "undefined" ? Bun.env : process.env;
const databaseUrl = env.DATABASE_URL;

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema/index.ts",
    out: "./drizzle",
    ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
