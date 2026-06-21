import { db } from "../src/db";
import { type users, type rideStops, carModels } from "../src/db/schema";

export const TEST_CITY_IDS = {
    bratislava: "00000000-0000-4000-8000-000000000001",
    banskaBystrica: "00000000-0000-4000-8000-000000000002",
};

export async function getAnyCarModelId(): Promise<number> {
    const [model] = await db.select().from(carModels).limit(1);
    if (!model) throw new Error("No car models found in the database.");
    return model.id;
}
