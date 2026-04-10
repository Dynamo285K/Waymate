import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const env = typeof Bun !== "undefined" ? Bun.env : process.env;
const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}

const client = postgres(databaseUrl as string);

export const db = drizzle(client, { schema });
export type Database = typeof db;
