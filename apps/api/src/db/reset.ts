import postgres from "postgres";
import { env } from "../config/env";
import { $ } from "bun";

// Only local dev databases and the CI service alias may be wiped. Checked by
// host, not NODE_ENV: a production URL in a developer's shell usually runs
// with NODE_ENV=development.
const RESETTABLE_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
    "postgres",
]);

async function run() {
    const url = process.env.DIRECT_URL || env.DATABASE_URL;
    const { hostname } = new URL(url);
    if (!RESETTABLE_HOSTS.has(hostname)) {
        console.error(
            `Refusing to reset the database on host "${hostname}". db:reset only runs against local databases.`
        );
        process.exit(1);
    }

    console.log("Dropping and recreating public & drizzle schemas...");
    const client = postgres(url, {
        max: 1,
    });

    await client.unsafe(
        "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
    );
    await client.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE;");
    await client.unsafe("GRANT ALL ON SCHEMA public TO postgres;");
    await client.unsafe("GRANT ALL ON SCHEMA public TO public;");

    await client.end();
    console.log("Schema reset successfully. Running migrations and seed...");

    await $`bun run db:migrate`;
    await $`bun run seed`;
}

run().catch((err) => {
    console.error("Database reset failed:", err);
    process.exit(1);
});
