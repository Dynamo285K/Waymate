import { sql } from "drizzle-orm";
import type { Executor } from "../../db";

const pingDatabase = async (executor: Executor): Promise<boolean> => {
    try {
        await executor.execute(sql`SELECT 1`);
        return true;
    } catch {
        return false;
    }
};

export const HealthRepository = {
    pingDatabase,
};
