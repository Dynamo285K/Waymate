import postgres from "postgres";
import { env } from "../src/config/env";
import { db } from "../src/db";
import { carModels, cities } from "../src/db/schema";
import carData from "../src/db/cars-data.json";
import { TEST_CITIES } from "./reference-data";

let client: postgres.Sql | null = null;
let cachedTables: string[] | null = null;

function getClient(): postgres.Sql {
    if (!client) {
        client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
    }
    return client;
}

/**
 * Truncates every table in the public schema except the drizzle migration
 * bookkeeping, then re-seeds reference data (cities, car_models) so tests can
 * rely on it without each test re-inserting lookup rows.
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
    // column mapping (modelName → model_name, nameNormalized →
    // name_normalized) is handled by the schema.
    await db.insert(cities).values(TEST_CITIES);
    await db.insert(carModels).values(carData);
}

export async function closeResetClient(): Promise<void> {
    if (client) {
        await client.end();
        client = null;
    }
}
