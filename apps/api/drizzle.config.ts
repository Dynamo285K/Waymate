import { defineConfig } from "drizzle-kit";

const env = typeof Bun !== "undefined" ? Bun.env : process.env;
const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: databaseUrl,
    },
});
