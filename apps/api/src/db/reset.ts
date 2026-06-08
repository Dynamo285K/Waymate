import postgres from "postgres";
import { env } from "../config/env";
import { $ } from "bun";

async function run() {
    console.log("Dropping and recreating public & drizzle schemas...");
    const client = postgres(env.DATABASE_URL, { max: 1 });

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
