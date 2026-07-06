import { db } from "./apps/api/src/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        const res = await db.execute(
            sql`SELECT unnest(enum_range(NULL::notification_type))`
        );
        console.log(
            "Values:",
            res.map((r) => r.unnest)
        );
    } catch (err: any) {
        console.log("Error:", err.message);
    }
    process.exit(0);
}
main();
