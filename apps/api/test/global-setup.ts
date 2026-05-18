import "./load-env";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error(
            "DATABASE_URL is not set. Copy apps/api/.env.test.example to .env.test."
        );
    }

    const url = new URL(databaseUrl);
    const dbName = url.pathname.replace(/^\//, "");
    if (!dbName) {
        throw new Error(
            `DATABASE_URL must include a database name, got: ${databaseUrl}`
        );
    }

    // Connect to the default 'postgres' database to create our test DB
    // if it doesn't exist yet. CREATE DATABASE can't run inside a tx and
    // can't be parameterized — identifier is quoted by hand.
    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = "/postgres";
    const admin = postgres(adminUrl.toString(), { max: 1 });
    try {
        const existing = await admin<{ count: number }[]>`
            SELECT count(*)::int AS count
            FROM pg_database
            WHERE datname = ${dbName}
        `;
        if (existing[0]!.count === 0) {
            await admin.unsafe(
                `CREATE DATABASE "${dbName.replace(/"/g, '""')}"`
            );
        }
    } finally {
        await admin.end();
    }

    // Apply migrations to the test DB.
    const client = postgres(databaseUrl, { max: 1 });
    try {
        const db = drizzle(client);
        await migrate(db, {
            migrationsFolder: path.resolve(dir, "../drizzle"),
        });
    } finally {
        await client.end();
    }
}
