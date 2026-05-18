import postgres from "postgres";
import { db } from "../src/db";
import { carModels } from "../src/db/schema";
import carData from "../src/db/cars-data.json";

let client: postgres.Sql | null = null;
let cachedTables: string[] | null = null;

function getClient(): postgres.Sql {
    if (!client) {
        const url = process.env.DATABASE_URL;
        if (!url) {
            throw new Error(
                "DATABASE_URL not set — did load-env.ts run before this module?"
            );
        }
        client = postgres(url, { max: 1, prepare: false });
    }
    return client;
}

/**
 * Truncates every table in the public schema except the drizzle migration
 * bookkeeping, then re-seeds reference data (car_models) so tests can rely
 * on it without each test re-inserting brands.
 *
 * Resetting via TRUNCATE (not transaction rollback) — services call
 * db.transaction() internally, and wrapping those in an outer test
 * transaction would silently turn them into savepoints and hide bugs.
 */
export async function resetDatabase(): Promise<void> {
    const sql = getClient();

    if (!cachedTables) {
        const rows = await sql<{ tablename: string }[]>`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename != '__drizzle_migrations'
        `;
        cachedTables = rows.map((r) => r.tablename);
    }

    if (cachedTables.length === 0) return;

    const list = cachedTables.map((t) => `"${t.replace(/"/g, '""')}"`).join(", ");
    await sql.unsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);

    // Re-seed reference data via drizzle so the camelCase → snake_case
    // column mapping (modelName → model_name) is handled by the schema.
    await db.insert(carModels).values(carData);
}

export async function closeResetClient(): Promise<void> {
    if (client) {
        await client.end();
        client = null;
    }
}
