import postgres from "postgres";

const rawUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
    console.error("No database URL provided for wait-for-db.ts");
    process.exit(1);
}

// Connect to the default database created by the postgres service,
// because specific databases (like spolujazda_e2e_db) might not exist yet.
const urlObj = new URL(rawUrl);
urlObj.pathname = `/${process.env.POSTGRES_DB || "postgres"}`;
const finalUrl = urlObj.toString();

const sql = postgres(finalUrl, { max: 1, connect_timeout: 5 });

const check = async () => {
    try {
        await sql`SELECT 1`;
        console.log("Database is ready!");
        process.exit(0);
    } catch (_e) {
        setTimeout(check, 1000);
    }
};

console.log("Waiting for database...");
check();
