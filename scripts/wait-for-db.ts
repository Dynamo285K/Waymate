import postgres from "postgres";

const url = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
    console.error("No database URL provided for wait-for-db.ts");
    process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 5 });

const check = async () => {
    try {
        await sql`SELECT 1`;
        console.log("Database is ready!");
        process.exit(0);
    } catch (e) {
        setTimeout(check, 1000);
    }
};

console.log("Waiting for database...");
check();
