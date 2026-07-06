import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./apps/api/src/config/env";

async function main() {
    const url = process.env.DIRECT_URL || env.DATABASE_URL;
    console.log("Using URL:", url);
    const sql = postgres(url, { max: 1 });
    const db = drizzle(sql);
    try {
        console.log("Starting migration...");
        await migrate(db, { migrationsFolder: "./apps/api/drizzle" });
        console.log("Success!");
    } catch (err: any) {
        console.log("MIGRATION ERROR:");
        console.dir(err, { depth: null });
    }
    process.exit(0);
}
main();
