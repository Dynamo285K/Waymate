import { afterAll, beforeEach } from "vitest";
import { closeResetClient, resetDatabase } from "./reset-db";

beforeEach(async () => {
    await resetDatabase();
});

afterAll(async () => {
    await closeResetClient();
});
