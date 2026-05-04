// Resets a previously-migrated database — does NOT create the schema.
// Run `bun run --cwd apps/api db:migrate` first on a fresh DB.
import { sql, eq, and } from "drizzle-orm";
import { db } from "./index";
import {
    carModels,
    users,
    cars,
    rides,
    rideStops,
    prices,
    bookings,
} from "./schema";
import { randomUUID } from "crypto";
import carData from "./cars-data.json";

async function main() {
    console.log("Starting reset and seeding of car models...");

    try {
        console.log("Clearing all old data and resetting IDs...");
        await db.execute(
            sql`TRUNCATE TABLE accounts, sessions, verifications, bookings, booking_status_history, prices, ride_stops, ride_status_history, rides, cars, car_models, reviews, conversations, messages, notifications, user_status_history, users, blocklist RESTART IDENTITY CASCADE`
        );

        console.log(`Inserting ${carData.length} car models...`);
        await db.insert(carModels).values(carData);

        console.log(
            "All car models successfully reset and seeded into the database."
        );

        // --- Additional seed data (users, cars, rides, prices, bookings) ---
        console.log("Seeding users, cars, rides and bookings...");

        await db.transaction(async (tx) => {
            // Users
            const userAId = randomUUID(); // driver A
            const userBId = randomUUID(); // driver B
            const userCId = randomUUID(); // passenger

            await tx.insert(users).values([
                {
                    id: userAId,
                    name: "Albert Olbert",
                    email: "driver.albert@example.com",
                    emailVerified: true,
                    firstName: "Albert",
                    lastName: "Olbert",
                    phone: "+421900111111",
                    userRole: "ADMIN",
                },
                {
                    id: userBId,
                    name: "Bela Novak",
                    email: "driver.bela@example.com",
                    emailVerified: true,
                    firstName: "Bela",
                    lastName: "Novak",
                    phone: "+421900222222",
                },
                {
                    id: userCId,
                    name: "Cyril Horak",
                    email: "passenger.cyril@example.com",
                    emailVerified: true,
                    firstName: "Cyril",
                    lastName: "Horak",
                    phone: "+421900333333",
                },
            ]);

            // Find model ids for specific models we want to use
            const octaviaRow = await tx
                .select({
                    id: carModels.id,
                    brand: carModels.brand,
                    modelName: carModels.modelName,
                })
                .from(carModels)
                .where(
                    and(
                        eq(carModels.brand, "Škoda"),
                        eq(carModels.modelName, "Octavia")
                    )
                );

            const golfRow = await tx
                .select({
                    id: carModels.id,
                    brand: carModels.brand,
                    modelName: carModels.modelName,
                })
                .from(carModels)
                .where(
                    and(
                        eq(carModels.brand, "Volkswagen"),
                        eq(carModels.modelName, "Golf")
                    )
                );

            const corollaRow = await tx
                .select({
                    id: carModels.id,
                    brand: carModels.brand,
                    modelName: carModels.modelName,
                })
                .from(carModels)
                .where(
                    and(
                        eq(carModels.brand, "Toyota"),
                        eq(carModels.modelName, "Corolla")
                    )
                );

            if (!octaviaRow[0] || !golfRow[0] || !corollaRow[0]) {
                throw new Error("Required car models not found after seeding");
            }

            const car1Id = randomUUID();
            const car2Id = randomUUID();
            const car3Id = randomUUID();

            await tx.insert(cars).values([
                {
                    id: car1Id,
                    ownerId: userAId,
                    modelId: octaviaRow[0].id,
                    spz: "BA123AB",
                    countryCode: "SK",
                    color: "GRAY",
                    seatsTotal: 4,
                },
                {
                    id: car2Id,
                    ownerId: userBId,
                    modelId: golfRow[0].id,
                    spz: "KE999ZZ",
                    countryCode: "SK",
                    color: "BLUE",
                    seatsTotal: 3,
                },
                {
                    id: car3Id,
                    ownerId: userAId,
                    modelId: corollaRow[0].id,
                    spz: "TT111TT",
                    countryCode: "SK",
                    color: "WHITE",
                    seatsTotal: 4,
                },
            ]);

            // Rides
            const ride1Id = randomUUID();
            const ride2Id = randomUUID();
            const ride3Id = randomUUID();

            await tx.insert(rides).values([
                {
                    id: ride1Id,
                    driverId: userAId,
                    carId: car1Id,
                    departureAt: new Date("2026-05-10T06:00:00+02:00"),
                    arrivalEstimateAt: new Date("2026-05-10T08:00:00+02:00"),
                    rideStatus: "PLANNED",
                    offeredSeats: 3,
                    currency: "EUR",
                    description: "Bratislava → Nitra",
                },
                {
                    id: ride2Id,
                    driverId: userBId,
                    carId: car2Id,
                    departureAt: new Date("2026-05-11T05:30:00+02:00"),
                    arrivalEstimateAt: new Date("2026-05-11T07:00:00+02:00"),
                    rideStatus: "PLANNED",
                    offeredSeats: 2,
                    currency: "EUR",
                    description: "Košice → Prešov",
                },
                {
                    id: ride3Id,
                    driverId: userAId,
                    carId: car3Id,
                    departureAt: new Date("2026-05-12T07:00:00+02:00"),
                    arrivalEstimateAt: new Date("2026-05-12T09:30:00+02:00"),
                    rideStatus: "PLANNED",
                    offeredSeats: 2,
                    currency: "EUR",
                    description: "Trenčín → Bratislava",
                },
            ]);

            // Ride stops for ride1 (Bratislava -> Trnava -> Nitra)
            const r1s0 = randomUUID();
            const r1s1 = randomUUID();
            const r1s2 = randomUUID();

            await tx.insert(rideStops).values([
                {
                    id: r1s0,
                    rideId: ride1Id,
                    address: "Hlavné námestie 1",
                    city: "Bratislava",
                    countryCode: "SK",
                    lat: 48.148598,
                    lng: 17.107748,
                    stopOrder: 0,
                },
                {
                    id: r1s1,
                    rideId: ride1Id,
                    address: "Námestie sv. Trojice",
                    city: "Trnava",
                    countryCode: "SK",
                    lat: 48.377018,
                    lng: 17.588771,
                    stopOrder: 1,
                },
                {
                    id: r1s2,
                    rideId: ride1Id,
                    address: "Námestie SNP",
                    city: "Nitra",
                    countryCode: "SK",
                    lat: 48.309085,
                    lng: 18.086213,
                    stopOrder: 2,
                },
            ]);

            // Prices for ride1: Bratislava -> Nitra (direct segment)
            const price1Id = randomUUID();
            await tx.insert(prices).values([
                {
                    id: price1Id,
                    rideId: ride1Id,
                    startStopId: r1s0,
                    endStopId: r1s2,
                    amount: 8,
                    currency: "EUR",
                },
            ]);

            // Ride2 stops (Košice -> Prešov)
            const r2s0 = randomUUID();
            const r2s1 = randomUUID();

            await tx.insert(rideStops).values([
                {
                    id: r2s0,
                    rideId: ride2Id,
                    address: "Hlavná 1",
                    city: "Košice",
                    countryCode: "SK",
                    lat: 48.716385,
                    lng: 21.261074,
                    stopOrder: 0,
                },
                {
                    id: r2s1,
                    rideId: ride2Id,
                    address: "Masarykova 2",
                    city: "Prešov",
                    countryCode: "SK",
                    lat: 48.999569,
                    lng: 21.239329,
                    stopOrder: 1,
                },
            ]);

            const price2Id = randomUUID();
            await tx.insert(prices).values([
                {
                    id: price2Id,
                    rideId: ride2Id,
                    startStopId: r2s0,
                    endStopId: r2s1,
                    amount: 6,
                    currency: "EUR",
                },
            ]);

            // Ride3 stops (Trenčín -> Bratislava)
            const r3s0 = randomUUID();
            const r3s1 = randomUUID();

            await tx.insert(rideStops).values([
                {
                    id: r3s0,
                    rideId: ride3Id,
                    address: "Mierové námestie",
                    city: "Trenčín",
                    countryCode: "SK",
                    lat: 48.894028,
                    lng: 18.042528,
                    stopOrder: 0,
                },
                {
                    id: r3s1,
                    rideId: ride3Id,
                    address: "Námestie SNP 1",
                    city: "Bratislava",
                    countryCode: "SK",
                    lat: 48.148598,
                    lng: 17.107748,
                    stopOrder: 1,
                },
            ]);

            const price3Id = randomUUID();
            await tx.insert(prices).values([
                {
                    id: price3Id,
                    rideId: ride3Id,
                    startStopId: r3s0,
                    endStopId: r3s1,
                    amount: 10,
                    currency: "EUR",
                },
            ]);

            // Bookings
            await tx.insert(bookings).values([
                {
                    id: randomUUID(),
                    passengerId: userCId,
                    rideId: ride1Id,
                    pickupStopId: r1s0,
                    dropoffStopId: r1s2,
                    seatCount: 1,
                    bookingStatus: "CONFIRMED",
                    priceAmount: 8,
                    currency: "EUR",
                    confirmedAt: new Date(),
                },
                {
                    id: randomUUID(),
                    passengerId: userCId,
                    rideId: ride2Id,
                    pickupStopId: r2s0,
                    dropoffStopId: r2s1,
                    seatCount: 1,
                    bookingStatus: "PENDING",
                    priceAmount: 6,
                    currency: "EUR",
                },
                {
                    id: randomUUID(),
                    passengerId: userBId,
                    rideId: ride1Id,
                    pickupStopId: r1s1,
                    dropoffStopId: r1s2,
                    seatCount: 1,
                    bookingStatus: "CONFIRMED",
                    priceAmount: 4,
                    currency: "EUR",
                    confirmedAt: new Date(),
                },
            ]);
        });

        console.log("Seeding finished successfully.");
    } catch (error) {
        console.error("Error during seeding:", error);
    } finally {
        process.exit(0);
    }
}

main();
