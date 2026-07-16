import postgres from "postgres";
import { env } from "../src/config/env";
import { carCatalog } from "@repo/shared/car-catalog";

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

    const list = cachedTables
        .map((t) => `"${t.replace(/"/g, '""')}"`)
        .join(", ");
    await sql.unsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);

    // Re-seed car_models on the same single-connection sql client that ran the
    // TRUNCATE. Using the shared Drizzle pool here risks the INSERT landing on
    // a pooled connection that has a stale implicit transaction from a previous
    // test, making the row invisible to queries on other connections.
    const seedRows = carCatalog.map(({ brand, modelName }) => ({
        brand,
        model_name: modelName,
    }));
    await sql`INSERT INTO car_models ${sql(seedRows)}`;
}

export async function closeResetClient(): Promise<void> {
    if (client) {
        await client.end();
        client = null;
    }
}
