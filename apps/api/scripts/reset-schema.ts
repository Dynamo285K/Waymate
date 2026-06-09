import postgres from "postgres";
import { env } from "../src/config/env";

async function run() {
    const client = postgres(env.DATABASE_URL, { max: 1 });
    console.log("Dropping and recreating public schema...");
    await client.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await client.unsafe("GRANT ALL ON SCHEMA public TO postgres;");
    await client.unsafe("GRANT ALL ON SCHEMA public TO public;");
    console.log("Schema reset successfully.");
    await client.end();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
