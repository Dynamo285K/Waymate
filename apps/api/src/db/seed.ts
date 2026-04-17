import { sql } from "drizzle-orm";
import { db } from "./index";
import { carModels } from "./schema";
import carData from "./cars-data.json";

async function main() {
    console.log("Starting reset and seeding of car models...");

    try {
        console.log("Clearing old models and resetting IDs...");
        await db.execute(
            sql`TRUNCATE TABLE car_models RESTART IDENTITY CASCADE`
        );

        console.log(`Inserting ${carData.length} car models...`);
        await db.insert(carModels).values(carData);

        console.log(
            "All car models successfully reset and seeded into the database."
        );
    } catch (error) {
        console.error("Error during seeding:", error);
    } finally {
        process.exit(0);
    }
}

main();
