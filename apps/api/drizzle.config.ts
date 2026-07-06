import { defineConfig } from "drizzle-kit";

const env = typeof Bun !== "undefined" ? Bun.env : process.env;
console.log("drizzle.config.ts loaded, DIRECT_URL:", env.DIRECT_URL);
console.log("DATABASE_URL:", env.DATABASE_URL);
const databaseUrl = env.DIRECT_URL || env.DATABASE_URL;

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema/index.ts",
    out: "./drizzle",
    ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
