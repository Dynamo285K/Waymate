// Resets a previously-migrated database — does NOT create the schema.
// Run `bun run --cwd apps/api db:migrate` first on a fresh DB.
import { sql, eq, and, inArray } from "drizzle-orm";
import { db } from "./index";
import {
    carModels,
    users,
    cars,
    rides,
    rideStops,
    prices,
    bookings,
    bookingStatusHistory,
    accounts,
    reviews,
    reviewStatusHistory,
    rideStatusHistory,
} from "./schema";
import { randomUUID } from "crypto";
import { carCatalog } from "@repo/shared/car-catalog";
import { auth } from "../modules/auth/auth";
import type { CountryCode } from "@repo/shared";
import * as h3 from "h3-js";

// Dev-only credentials. Documented here on purpose so anyone running
// `db:seed` knows how to log in without re-deriving them.
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin1234";
const DRIVER_EMAIL = "driver.albert@example.com";
const DRIVER_PASSWORD = "driver1234";
const PASSENGER_EMAIL = "passenger.cyril@example.com";
const PASSENGER_PASSWORD = "passenger1234";
const MINUTE_MS = 60 * 1000;

const dateAtOffset = (daysFromToday: number, hours: number, minutes = 0) => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setDate(date.getDate() + daysFromToday);
    return date;
};

const addMinutes = (date: Date, minutes: number) =>
    new Date(date.getTime() + minutes * MINUTE_MS);

async function main() {
    console.log("Starting reset and seeding of car models...");
    let exitCode = 0;

    try {
        console.log("Clearing all old data and resetting IDs...");
        await db.execute(
            sql`TRUNCATE TABLE accounts, sessions, verifications, bookings, booking_status_history, prices, ride_stops, ride_status_history, rides, cars, car_models, reviews, review_status_history, conversations, messages, notifications, user_status_history, users, blocklist RESTART IDENTITY CASCADE`
        );

        console.log(`Inserting ${carCatalog.length} car models...`);
        await db.insert(carModels).values(carCatalog);

        console.log(
            "All car models successfully reset and seeded into the database."
        );

        // --- Additional seed data (users, cars, rides, prices, bookings, reviews) ---
        console.log("Seeding users, cars, rides, bookings and reviews...");

        // Lifted out of the transaction so the post-commit accounts insert
        // (admin + driver passwords) can reference them.
        const adminId = randomUUID();
        const userAId = randomUUID(); // driver A — has password (see DRIVER_EMAIL)
        const userCId = randomUUID(); // passenger C — has password (see PASSENGER_EMAIL)

        await db.transaction(async (tx) => {
            // Users
            const userBId = randomUUID(); // driver B

            // Bulk USER fixtures so the admin tooling has something to
            // page/search through. First+last names rotate across two pools
            // (coprime stride) for varied combinations; statuses sprinkle
            // SUSPENDED/BANNED so StatusBadge renders all variants; createdAt
            // is staggered hour-by-hour so keyset pagination has visible
            // chronological order.
            const firstNamePool = [
                "Adam",
                "Bela",
                "Cyril",
                "Dana",
                "Eva",
                "Filip",
                "Gabriel",
                "Hana",
                "Igor",
                "Jana",
                "Karol",
                "Lucia",
                "Martin",
                "Nina",
                "Oliver",
                "Pavla",
                "Radek",
                "Sara",
                "Tomas",
                "Viktor",
            ];
            const lastNamePool = [
                "Novak",
                "Horak",
                "Kovac",
                "Mala",
                "Novotna",
                "Cerny",
                "Kral",
                "Jurek",
                "Lukas",
                "Mares",
                "Ondra",
                "Polak",
                "Ruzicka",
                "Stanek",
                "Tichy",
                "Urban",
                "Vetrov",
                "Zelinka",
                "Zatla",
                "Wenig",
            ];

            const SEED_USER_COUNT = 100;
            const bulkUsers = Array.from(
                { length: SEED_USER_COUNT },
                (_, i) => {
                    const n = i + 1;
                    const firstName = firstNamePool[i % firstNamePool.length]!;
                    const lastName =
                        lastNamePool[(i * 13) % lastNamePool.length]!;
                    const userStatus: "ACTIVE" | "SUSPENDED" | "BANNED" =
                        n % 25 === 0
                            ? "BANNED"
                            : n % 17 === 0
                              ? "SUSPENDED"
                              : "ACTIVE";
                    return {
                        id: randomUUID(),
                        name: `${firstName} ${lastName}`,
                        email: `user.${n}@example.com`,
                        emailVerified: true,
                        firstName,
                        lastName,
                        phone: `+42190010${String(n).padStart(4, "0")}`,
                        createdAt: new Date(Date.now() - n * 3600 * 1000),
                        userStatus,
                        banned: userStatus === "BANNED",
                    };
                }
            );

            await tx.insert(users).values([
                {
                    id: adminId,
                    name: "Admin Adminova",
                    email: ADMIN_EMAIL,
                    emailVerified: true,
                    firstName: "Admin",
                    lastName: "Adminova",
                    phone: "+421900000001",
                    userRole: "ADMIN",
                },
                {
                    id: userAId,
                    name: "Albert Olbert",
                    email: DRIVER_EMAIL,
                    emailVerified: true,
                    firstName: "Albert",
                    lastName: "Olbert",
                    phone: "+421900111111",
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
                    email: PASSENGER_EMAIL,
                    emailVerified: true,
                    firstName: "Cyril",
                    lastName: "Horak",
                    phone: "+421900333333",
                },
                ...bulkUsers,
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

            type RideFixtureStatus = "PLANNED" | "COMPLETED";
            type BookingFixtureStatus = "PENDING" | "CONFIRMED" | "COMPLETED";
            type RatingFixture = 3 | 4 | 5;
            type StopFixture = {
                address: string;
                city: string;
                lat: number;
                lng: number;
                arrivalOffsetMinutes?: number;
                departureOffsetMinutes?: number;
            };
            type PriceFixture = {
                startStopOrder: number;
                endStopOrder: number;
                amount: number;
            };
            type SeededRide = {
                id: string;
                driverId: string;
                departureAt: Date;
                arrivalEstimateAt: Date;
                rideStatus: RideFixtureStatus;
                currency: "EUR";
                stopIdsByOrder: Map<number, string>;
                priceBySegment: Map<string, number>;
            };

            const passengerAdamId = bulkUsers[0].id;
            const passengerEvaId = bulkUsers[4].id;
            const passengerLuciaId = bulkUsers[11].id;

            const segmentKey = (startStopOrder: number, endStopOrder: number) =>
                `${startStopOrder}:${endStopOrder}`;

            const seedRide = async (input: {
                driverId: string;
                carId: string;
                departureAt: Date;
                durationMinutes: number;
                rideStatus: RideFixtureStatus;
                offeredSeats: number;
                description: string;
                stops: StopFixture[];
                prices: PriceFixture[];
            }): Promise<SeededRide> => {
                const rideId = randomUUID();
                const arrivalEstimateAt = addMinutes(
                    input.departureAt,
                    input.durationMinutes
                );
                const createdAt =
                    input.departureAt > new Date()
                        ? addMinutes(new Date(), -180)
                        : addMinutes(input.departureAt, -2 * 24 * 60);
                const updatedAt =
                    input.rideStatus === "COMPLETED"
                        ? arrivalEstimateAt
                        : createdAt;
                const isCompleted = input.rideStatus === "COMPLETED";

                await tx.insert(rides).values({
                    id: rideId,
                    driverId: input.driverId,
                    carId: input.carId,
                    departureAt: input.departureAt,
                    arrivalEstimateAt,
                    autoEndAt: arrivalEstimateAt,
                    endedAt: isCompleted ? arrivalEstimateAt : null,
                    endedByUserId: isCompleted ? input.driverId : null,
                    endSource: isCompleted ? "DRIVER" : null,
                    endReason: isCompleted ? "Fixture ride completed" : null,
                    rideStatus: input.rideStatus,
                    offeredSeats: input.offeredSeats,
                    currency: "EUR",
                    description: input.description,
                    createdAt,
                    updatedAt,
                });

                const stopRows = input.stops.map((stop, stopOrder) => ({
                    id: randomUUID(),
                    rideId,
                    address: stop.address,
                    city: stop.city,
                    countryCode: "SK" as CountryCode,
                    h3Res7: h3.latLngToCell(stop.lat, stop.lng, 7),
                    h3Res8: h3.latLngToCell(stop.lat, stop.lng, 8),
                    lat: stop.lat,
                    lng: stop.lng,
                    stopOrder,
                    plannedArrivalAt:
                        stop.arrivalOffsetMinutes === undefined
                            ? null
                            : addMinutes(
                                  input.departureAt,
                                  stop.arrivalOffsetMinutes
                              ),
                    plannedDepartureAt:
                        stop.departureOffsetMinutes === undefined
                            ? null
                            : addMinutes(
                                  input.departureAt,
                                  stop.departureOffsetMinutes
                              ),
                    createdAt,
                    updatedAt,
                }));

                await tx.insert(rideStops).values(stopRows);

                const stopIdsByOrder = new Map(
                    stopRows.map((stop) => [stop.stopOrder, stop.id])
                );

                await tx.insert(prices).values(
                    input.prices.map((price) => {
                        const startStopId = stopIdsByOrder.get(
                            price.startStopOrder
                        );
                        const endStopId = stopIdsByOrder.get(
                            price.endStopOrder
                        );

                        if (!startStopId || !endStopId) {
                            throw new Error(
                                `Invalid price stop order for fixture ride: ${input.description}`
                            );
                        }

                        return {
                            id: randomUUID(),
                            rideId,
                            startStopId,
                            endStopId,
                            amount: price.amount,
                            currency: "EUR",
                            createdAt,
                            updatedAt,
                        };
                    })
                );

                await tx.insert(rideStatusHistory).values(
                    input.rideStatus === "COMPLETED"
                        ? [
                              {
                                  rideId,
                                  newStatus: "PLANNED" as const,
                                  changedByUserId: input.driverId,
                                  reason: "Fixture ride created",
                                  createdAt,
                              },
                              {
                                  rideId,
                                  oldStatus: "PLANNED" as const,
                                  newStatus: "COMPLETED" as const,
                                  changedByUserId: input.driverId,
                                  reason: "Fixture ride completed",
                                  createdAt: arrivalEstimateAt,
                              },
                          ]
                        : [
                              {
                                  rideId,
                                  newStatus: "PLANNED" as const,
                                  changedByUserId: input.driverId,
                                  reason: "Fixture ride created",
                                  createdAt,
                              },
                          ]
                );

                return {
                    id: rideId,
                    driverId: input.driverId,
                    departureAt: input.departureAt,
                    arrivalEstimateAt,
                    rideStatus: input.rideStatus,
                    currency: "EUR",
                    stopIdsByOrder,
                    priceBySegment: new Map(
                        input.prices.map((price) => [
                            segmentKey(
                                price.startStopOrder,
                                price.endStopOrder
                            ),
                            price.amount,
                        ])
                    ),
                };
            };

            const seedBooking = async (input: {
                ride: SeededRide;
                passengerId: string;
                pickupStopOrder: number;
                dropoffStopOrder: number;
                seatCount: number;
                bookingStatus: BookingFixtureStatus;
                createdAt?: Date;
            }) => {
                const pickupStopId = input.ride.stopIdsByOrder.get(
                    input.pickupStopOrder
                );
                const dropoffStopId = input.ride.stopIdsByOrder.get(
                    input.dropoffStopOrder
                );
                const segmentAmount = input.ride.priceBySegment.get(
                    segmentKey(input.pickupStopOrder, input.dropoffStopOrder)
                );

                if (
                    !pickupStopId ||
                    !dropoffStopId ||
                    segmentAmount === undefined
                ) {
                    throw new Error(
                        `Invalid booking segment for fixture ride ${input.ride.id}`
                    );
                }

                const createdAt =
                    input.createdAt ??
                    (input.ride.departureAt > new Date()
                        ? addMinutes(new Date(), -120)
                        : addMinutes(input.ride.departureAt, -3 * 24 * 60));
                const confirmedAt =
                    input.bookingStatus === "PENDING"
                        ? null
                        : addMinutes(createdAt, 90);
                const completedAt =
                    input.bookingStatus === "COMPLETED"
                        ? addMinutes(input.ride.arrivalEstimateAt, 15)
                        : null;
                const updatedAt = completedAt ?? confirmedAt ?? createdAt;
                const bookingId = randomUUID();

                await tx.insert(bookings).values({
                    id: bookingId,
                    passengerId: input.passengerId,
                    rideId: input.ride.id,
                    pickupStopId,
                    dropoffStopId,
                    seatCount: input.seatCount,
                    bookingStatus: input.bookingStatus,
                    priceAmount: segmentAmount * input.seatCount,
                    currency: input.ride.currency,
                    confirmedAt,
                    createdAt,
                    updatedAt,
                });

                await tx.insert(bookingStatusHistory).values([
                    {
                        bookingId,
                        newStatus: "PENDING" as const,
                        changedByUserId: input.passengerId,
                        reason: "Fixture booking requested",
                        createdAt,
                    },
                    ...(confirmedAt
                        ? [
                              {
                                  bookingId,
                                  oldStatus: "PENDING" as const,
                                  newStatus: "CONFIRMED" as const,
                                  changedByUserId: input.ride.driverId,
                                  reason: "Fixture booking confirmed",
                                  createdAt: confirmedAt,
                              },
                          ]
                        : []),
                    ...(completedAt
                        ? [
                              {
                                  bookingId,
                                  oldStatus: "CONFIRMED" as const,
                                  newStatus: "COMPLETED" as const,
                                  changedByUserId: input.ride.driverId,
                                  reason: "Fixture ride completed",
                                  createdAt: completedAt,
                              },
                          ]
                        : []),
                ]);

                return bookingId;
            };

            const seedReview = async (input: {
                ride: SeededRide;
                authorId: string;
                subjectId: string;
                rating: RatingFixture;
                comment: string;
                createdAt?: Date;
            }) => {
                if (input.ride.rideStatus !== "COMPLETED") {
                    throw new Error(
                        "Fixture reviews must target completed rides"
                    );
                }

                const reviewId = randomUUID();
                const createdAt =
                    input.createdAt ??
                    addMinutes(input.ride.arrivalEstimateAt, 6 * 60);

                await tx.insert(reviews).values({
                    id: reviewId,
                    rideId: input.ride.id,
                    authorId: input.authorId,
                    subjectId: input.subjectId,
                    rating: input.rating,
                    comment: input.comment,
                    reviewStatus: "VISIBLE",
                    createdAt,
                    updatedAt: createdAt,
                });

                await tx.insert(reviewStatusHistory).values({
                    reviewId,
                    newStatus: "VISIBLE",
                    changedByUserId: input.authorId,
                    reason: "Fixture review created",
                    createdAt,
                });

                return reviewId;
            };

            // Completed past rides for Albert and other test drivers.
            const albertPastNitra = await seedRide({
                driverId: userAId,
                carId: car1Id,
                departureAt: dateAtOffset(-3, 8, 15),
                durationMinutes: 105,
                rideStatus: "COMPLETED",
                offeredSeats: 3,
                description: "Bratislava → Nitra cez Trnavu",
                stops: [
                    {
                        address: "Hlavné námestie 1",
                        city: "Bratislava",
                        lat: 48.148598,
                        lng: 17.107748,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Námestie sv. Trojice",
                        city: "Trnava",
                        lat: 48.377018,
                        lng: 17.588771,
                        arrivalOffsetMinutes: 35,
                        departureOffsetMinutes: 40,
                    },
                    {
                        address: "Námestie SNP",
                        city: "Nitra",
                        lat: 48.309085,
                        lng: 18.086213,
                        arrivalOffsetMinutes: 105,
                    },
                ],
                prices: [
                    { startStopOrder: 0, endStopOrder: 1, amount: 4 },
                    { startStopOrder: 1, endStopOrder: 2, amount: 5 },
                    { startStopOrder: 0, endStopOrder: 2, amount: 9 },
                ],
            });

            const albertPastBratislava = await seedRide({
                driverId: userAId,
                carId: car3Id,
                departureAt: dateAtOffset(-6, 15, 30),
                durationMinutes: 120,
                rideStatus: "COMPLETED",
                offeredSeats: 2,
                description: "Trenčín → Bratislava cez Trnavu",
                stops: [
                    {
                        address: "Mierové námestie",
                        city: "Trenčín",
                        lat: 48.894028,
                        lng: 18.042528,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Námestie sv. Trojice",
                        city: "Trnava",
                        lat: 48.377018,
                        lng: 17.588771,
                        arrivalOffsetMinutes: 75,
                        departureOffsetMinutes: 80,
                    },
                    {
                        address: "Autobusová stanica Nivy",
                        city: "Bratislava",
                        lat: 48.146237,
                        lng: 17.126046,
                        arrivalOffsetMinutes: 120,
                    },
                ],
                prices: [
                    { startStopOrder: 0, endStopOrder: 1, amount: 6 },
                    { startStopOrder: 1, endStopOrder: 2, amount: 5 },
                    { startStopOrder: 0, endStopOrder: 2, amount: 11 },
                ],
            });

            const albertPastKosice = await seedRide({
                driverId: userAId,
                carId: car1Id,
                departureAt: dateAtOffset(-10, 7, 0),
                durationMinutes: 330,
                rideStatus: "COMPLETED",
                offeredSeats: 4,
                description: "Bratislava → Košice cez Banskú Bystricu a Poprad",
                stops: [
                    {
                        address: "Einsteinova 18",
                        city: "Bratislava",
                        lat: 48.133412,
                        lng: 17.107498,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Námestie SNP 1",
                        city: "Banská Bystrica",
                        lat: 48.736277,
                        lng: 19.146191,
                        arrivalOffsetMinutes: 115,
                        departureOffsetMinutes: 125,
                    },
                    {
                        address: "Železničná stanica Poprad-Tatry",
                        city: "Poprad",
                        lat: 49.06144,
                        lng: 20.29798,
                        arrivalOffsetMinutes: 225,
                        departureOffsetMinutes: 235,
                    },
                    {
                        address: "Staničné námestie",
                        city: "Košice",
                        lat: 48.716385,
                        lng: 21.261074,
                        arrivalOffsetMinutes: 330,
                    },
                ],
                prices: [
                    { startStopOrder: 0, endStopOrder: 1, amount: 11 },
                    { startStopOrder: 1, endStopOrder: 2, amount: 8 },
                    { startStopOrder: 2, endStopOrder: 3, amount: 9 },
                    { startStopOrder: 0, endStopOrder: 2, amount: 18 },
                    { startStopOrder: 0, endStopOrder: 3, amount: 24 },
                    { startStopOrder: 1, endStopOrder: 3, amount: 15 },
                ],
            });

            const belaPastPresov = await seedRide({
                driverId: userBId,
                carId: car2Id,
                departureAt: dateAtOffset(-4, 17, 15),
                durationMinutes: 50,
                rideStatus: "COMPLETED",
                offeredSeats: 2,
                description: "Košice → Prešov",
                stops: [
                    {
                        address: "Hlavná 1",
                        city: "Košice",
                        lat: 48.716385,
                        lng: 21.261074,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Masarykova 2",
                        city: "Prešov",
                        lat: 48.999569,
                        lng: 21.239329,
                        arrivalOffsetMinutes: 50,
                    },
                ],
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 6 }],
            });

            const belaPastZilina = await seedRide({
                driverId: userBId,
                carId: car2Id,
                departureAt: dateAtOffset(-8, 6, 45),
                durationMinutes: 210,
                rideStatus: "COMPLETED",
                offeredSeats: 3,
                description: "Košice → Žilina cez Poprad",
                stops: [
                    {
                        address: "Staničné námestie",
                        city: "Košice",
                        lat: 48.716385,
                        lng: 21.261074,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Železničná stanica Poprad-Tatry",
                        city: "Poprad",
                        lat: 49.06144,
                        lng: 20.29798,
                        arrivalOffsetMinutes: 80,
                        departureOffsetMinutes: 90,
                    },
                    {
                        address: "Mariánske námestie",
                        city: "Žilina",
                        lat: 49.223467,
                        lng: 18.739313,
                        arrivalOffsetMinutes: 210,
                    },
                ],
                prices: [
                    { startStopOrder: 0, endStopOrder: 1, amount: 8 },
                    { startStopOrder: 1, endStopOrder: 2, amount: 10 },
                    { startStopOrder: 0, endStopOrder: 2, amount: 17 },
                ],
            });

            // Future Albert rides covering no-passenger, pending and confirmed states.
            await seedRide({
                driverId: userAId,
                carId: car1Id,
                departureAt: dateAtOffset(2, 9, 0),
                durationMinutes: 95,
                rideStatus: "PLANNED",
                offeredSeats: 3,
                description: "Bratislava → Nitra, voľné všetky miesta",
                stops: [
                    {
                        address: "Hlavná stanica",
                        city: "Bratislava",
                        lat: 48.15812,
                        lng: 17.10674,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Námestie sv. Trojice",
                        city: "Trnava",
                        lat: 48.377018,
                        lng: 17.588771,
                        arrivalOffsetMinutes: 35,
                        departureOffsetMinutes: 40,
                    },
                    {
                        address: "Námestie SNP",
                        city: "Nitra",
                        lat: 48.309085,
                        lng: 18.086213,
                        arrivalOffsetMinutes: 95,
                    },
                ],
                prices: [
                    { startStopOrder: 0, endStopOrder: 1, amount: 5 },
                    { startStopOrder: 1, endStopOrder: 2, amount: 6 },
                    { startStopOrder: 0, endStopOrder: 2, amount: 10 },
                ],
            });

            const albertUpcomingPending = await seedRide({
                driverId: userAId,
                carId: car3Id,
                departureAt: dateAtOffset(4, 14, 30),
                durationMinutes: 70,
                rideStatus: "PLANNED",
                offeredSeats: 3,
                description: "Trenčín → Žilina, čakajúce žiadosti",
                stops: [
                    {
                        address: "Mierové námestie",
                        city: "Trenčín",
                        lat: 48.894028,
                        lng: 18.042528,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Mariánske námestie",
                        city: "Žilina",
                        lat: 49.223467,
                        lng: 18.739313,
                        arrivalOffsetMinutes: 70,
                    },
                ],
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 8 }],
            });

            const albertUpcomingConfirmed = await seedRide({
                driverId: userAId,
                carId: car1Id,
                departureAt: dateAtOffset(7, 6, 45),
                durationMinutes: 180,
                rideStatus: "PLANNED",
                offeredSeats: 4,
                description: "Bratislava → Žilina s potvrdenými pasažiermi",
                stops: [
                    {
                        address: "Autobusová stanica Nivy",
                        city: "Bratislava",
                        lat: 48.146237,
                        lng: 17.126046,
                        departureOffsetMinutes: 0,
                    },
                    {
                        address: "Mierové námestie",
                        city: "Trenčín",
                        lat: 48.894028,
                        lng: 18.042528,
                        arrivalOffsetMinutes: 95,
                        departureOffsetMinutes: 105,
                    },
                    {
                        address: "Mariánske námestie",
                        city: "Žilina",
                        lat: 49.223467,
                        lng: 18.739313,
                        arrivalOffsetMinutes: 180,
                    },
                ],
                prices: [
                    { startStopOrder: 0, endStopOrder: 1, amount: 11 },
                    { startStopOrder: 1, endStopOrder: 2, amount: 8 },
                    { startStopOrder: 0, endStopOrder: 2, amount: 17 },
                ],
            });

            await seedBooking({
                ride: albertPastNitra,
                passengerId: userCId,
                pickupStopOrder: 0,
                dropoffStopOrder: 2,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: albertPastNitra,
                passengerId: passengerAdamId,
                pickupStopOrder: 0,
                dropoffStopOrder: 1,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: albertPastBratislava,
                passengerId: userBId,
                pickupStopOrder: 0,
                dropoffStopOrder: 2,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: albertPastBratislava,
                passengerId: passengerEvaId,
                pickupStopOrder: 1,
                dropoffStopOrder: 2,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: albertPastKosice,
                passengerId: userCId,
                pickupStopOrder: 0,
                dropoffStopOrder: 3,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: albertPastKosice,
                passengerId: passengerLuciaId,
                pickupStopOrder: 1,
                dropoffStopOrder: 2,
                seatCount: 2,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: belaPastPresov,
                passengerId: userCId,
                pickupStopOrder: 0,
                dropoffStopOrder: 1,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: belaPastPresov,
                passengerId: userAId,
                pickupStopOrder: 0,
                dropoffStopOrder: 1,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: belaPastZilina,
                passengerId: passengerAdamId,
                pickupStopOrder: 0,
                dropoffStopOrder: 2,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: belaPastZilina,
                passengerId: passengerEvaId,
                pickupStopOrder: 1,
                dropoffStopOrder: 2,
                seatCount: 1,
                bookingStatus: "COMPLETED",
            });
            await seedBooking({
                ride: albertUpcomingPending,
                passengerId: userCId,
                pickupStopOrder: 0,
                dropoffStopOrder: 1,
                seatCount: 1,
                bookingStatus: "PENDING",
            });
            await seedBooking({
                ride: albertUpcomingPending,
                passengerId: passengerAdamId,
                pickupStopOrder: 0,
                dropoffStopOrder: 1,
                seatCount: 1,
                bookingStatus: "PENDING",
            });
            await seedBooking({
                ride: albertUpcomingConfirmed,
                passengerId: userCId,
                pickupStopOrder: 0,
                dropoffStopOrder: 2,
                seatCount: 1,
                bookingStatus: "CONFIRMED",
            });
            await seedBooking({
                ride: albertUpcomingConfirmed,
                passengerId: passengerEvaId,
                pickupStopOrder: 1,
                dropoffStopOrder: 2,
                seatCount: 2,
                bookingStatus: "CONFIRMED",
            });

            await seedReview({
                ride: albertPastNitra,
                authorId: userCId,
                subjectId: userAId,
                rating: 5,
                comment:
                    "Albert prišiel načas, auto bolo čisté a cesta ubehla veľmi pohodovo.",
            });
            await seedReview({
                ride: albertPastNitra,
                authorId: passengerAdamId,
                subjectId: userAId,
                rating: 4,
                comment:
                    "Dobrá komunikácia pred odchodom a bezpečná jazda do Trnavy.",
            });
            await seedReview({
                ride: albertPastNitra,
                authorId: userAId,
                subjectId: userCId,
                rating: 5,
                comment:
                    "Cyril bol pripravený na zastávke a jazda s ním bola bez problémov.",
            });
            await seedReview({
                ride: albertPastNitra,
                authorId: userAId,
                subjectId: passengerAdamId,
                rating: 4,
                comment:
                    "Milý spolucestujúci, nastúpil načas a dal vedieť všetko potrebné.",
            });
            await seedReview({
                ride: albertPastBratislava,
                authorId: userBId,
                subjectId: userAId,
                rating: 5,
                comment:
                    "Plynulá jazda a príjemná debata, určite by som išiel znovu.",
            });
            await seedReview({
                ride: albertPastBratislava,
                authorId: passengerEvaId,
                subjectId: userAId,
                rating: 5,
                comment:
                    "Albert bol ochotný zastaviť v Trnave a všetko prebehlo presne podľa dohody.",
            });
            await seedReview({
                ride: albertPastBratislava,
                authorId: userAId,
                subjectId: userBId,
                rating: 4,
                comment:
                    "Bela komunikoval jasne a na nástup prišiel s predstihom.",
            });
            await seedReview({
                ride: albertPastBratislava,
                authorId: userAId,
                subjectId: passengerEvaId,
                rating: 5,
                comment: "Bezproblémová pasažierka, príjemná a spoľahlivá.",
            });
            await seedReview({
                ride: albertPastKosice,
                authorId: userCId,
                subjectId: userAId,
                rating: 4,
                comment:
                    "Dlhšia cesta bola dobre naplánovaná, prestávky aj časy sedeli.",
            });
            await seedReview({
                ride: albertPastKosice,
                authorId: passengerLuciaId,
                subjectId: userAId,
                rating: 5,
                comment: "Výborný vodič, pokojná jazda a férová cena za trasu.",
            });
            await seedReview({
                ride: albertPastKosice,
                authorId: userAId,
                subjectId: passengerLuciaId,
                rating: 5,
                comment:
                    "Lucia bola veľmi príjemná a s miestami pre batožinu sme sa dohodli vopred.",
            });
            await seedReview({
                ride: belaPastPresov,
                authorId: userCId,
                subjectId: userBId,
                rating: 5,
                comment: "Bela poznal trasu, jazda bola rýchla a bezpečná.",
            });
            await seedReview({
                ride: belaPastPresov,
                authorId: userAId,
                subjectId: userBId,
                rating: 4,
                comment:
                    "Dobrá jazda medzi Košicami a Prešovom, všetko podľa plánu.",
            });
            await seedReview({
                ride: belaPastPresov,
                authorId: userBId,
                subjectId: userCId,
                rating: 5,
                comment: "Cyril bol presný a dal včas vedieť, kde nastúpi.",
            });
            await seedReview({
                ride: belaPastPresov,
                authorId: userBId,
                subjectId: userAId,
                rating: 5,
                comment:
                    "Albert ako pasažier bol spoľahlivý a príjemný spoločník.",
            });
            await seedReview({
                ride: belaPastZilina,
                authorId: passengerAdamId,
                subjectId: userBId,
                rating: 4,
                comment: "Spoľahlivá jazda s krátkou prestávkou v Poprade.",
            });
            await seedReview({
                ride: belaPastZilina,
                authorId: passengerEvaId,
                subjectId: userBId,
                rating: 5,
                comment:
                    "Bela bol ústretový pri čase nástupu a cesta bola pohodlná.",
            });
            await seedReview({
                ride: belaPastZilina,
                authorId: userBId,
                subjectId: passengerAdamId,
                rating: 4,
                comment:
                    "Adam nastúpil presne a cesta prebehla bez komplikácií.",
            });
            await seedReview({
                ride: belaPastZilina,
                authorId: userBId,
                subjectId: passengerEvaId,
                rating: 5,
                comment:
                    "Eva bola pripravená a komunikácia bola veľmi jednoduchá.",
            });
        });

        // Set email/password credentials for designated dev users. Uses
        // better-auth's hashing primitive directly so we don't trigger
        // sign-up side effects (verification email, rate limiting, the
        // duplicate-email hook).
        const authContext = await auth.$context;
        const setPassword = async (userId: string, plaintext: string) => {
            await db.insert(accounts).values({
                id: randomUUID(),
                userId,
                // For the credential provider, better-auth uses the user id
                // as the account id (one credential row per user).
                accountId: userId,
                providerId: "credential",
                password: await authContext.password.hash(plaintext),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        };

        await setPassword(adminId, ADMIN_PASSWORD);
        await setPassword(userAId, DRIVER_PASSWORD);
        await setPassword(userCId, PASSENGER_PASSWORD);

        console.log("Seeding finished. Dev logins:");
        console.log(`  admin:     ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
        console.log(`  driver:    ${DRIVER_EMAIL} / ${DRIVER_PASSWORD}`);
        console.log(`  passenger: ${PASSENGER_EMAIL} / ${PASSENGER_PASSWORD}`);
    } catch (error) {
        console.error("Error during seeding:", error);
        exitCode = 1;
    } finally {
        process.exit(exitCode);
    }
}

main();
