import { describe, it, expect } from "vitest";
import { db } from "../../db";
import { carModels, rides, users } from "../../db/schema";
import { CarService } from "./car.service";
import { CarError, CarErrorCodes } from "./car.errors";
import { createTestCar } from "../../../test/factories";

async function insertTestUser() {
    const [user] = await db
        .insert(users)
        .values({
            name: "Test User",
            email: `test-${crypto.randomUUID()}@example.com`,
        })
        .returning();
    if (!user) throw new Error("Failed to insert test user");
    return user;
}

describe("CarService.createCar", () => {
    it("creates a car owned by the given user", async () => {
        const user = await insertTestUser();
        const model = await db.select().from(carModels).limit(1);
        const modelId = model[0]!.id;

        const car = await CarService.createCar(user.id, {
            modelId,
            spz: "AB123CD",
            countryCode: "SK",
            color: "BLUE",
            seatsTotal: 4,
        });

        expect(car.ownerId).toBe(user.id);
        expect(car.modelId).toBe(modelId);
        expect(car.spz).toBe("AB123CD");
        expect(car.seatsTotal).toBe(4);
    });

    it("throws DuplicatePlate on a unique-violation", async () => {
        const user = await insertTestUser();
        const model = await db.select().from(carModels).limit(1);
        const modelId = model[0]!.id;

        await CarService.createCar(user.id, {
            modelId,
            spz: "DUPL01",
            countryCode: "SK",
            color: "RED",
            seatsTotal: 4,
        });

        await expect(
            CarService.createCar(user.id, {
                modelId,
                spz: "DUPL01",
                countryCode: "SK",
                color: "RED",
                seatsTotal: 4,
            })
        ).rejects.toMatchObject({
            // CarError extends DomainError; assert by code rather than instance
            // to keep the test resilient to refactors of the error hierarchy.
            code: CarErrorCodes.DuplicatePlate,
        });
    });

    it("throws ModelNotFound when the model_id doesn't exist", async () => {
        const user = await insertTestUser();

        await expect(
            CarService.createCar(user.id, {
                modelId: 999_999,
                spz: "AB999XX",
                countryCode: "SK",
                color: "BLACK",
                seatsTotal: 4,
            })
        ).rejects.toBeInstanceOf(CarError);
    });
});

describe("CarService.deleteCar", () => {
    it("soft-deletes a car owned by the user", async () => {
        const user = await insertTestUser();
        const car = await createTestCar(user.id);

        const deleted = await CarService.deleteCar(car.id, user.id);

        expect(deleted.id).toBe(car.id);
        expect(deleted.deletedAt).not.toBeNull();
        expect(deleted.isActive).toBe(false);
    });

    it("throws CarNotFound when another user tries to delete the car", async () => {
        const owner = await insertTestUser();
        const stranger = await insertTestUser();
        const car = await createTestCar(owner.id);

        await expect(
            CarService.deleteCar(car.id, stranger.id)
        ).rejects.toMatchObject({ code: CarErrorCodes.CarNotFound });
    });

    it("throws CarNotFound on a second delete (already soft-deleted)", async () => {
        const user = await insertTestUser();
        const car = await createTestCar(user.id);
        await CarService.deleteCar(car.id, user.id);

        await expect(
            CarService.deleteCar(car.id, user.id)
        ).rejects.toMatchObject({ code: CarErrorCodes.CarNotFound });
    });

    it("throws CarNotFound for an unknown car id", async () => {
        const user = await insertTestUser();

        await expect(
            CarService.deleteCar(crypto.randomUUID(), user.id)
        ).rejects.toMatchObject({ code: CarErrorCodes.CarNotFound });
    });

    it("throws CarInUse and keeps the car when it has an active ride", async () => {
        const user = await insertTestUser();
        const car = await createTestCar(user.id);

        // A non-terminal ride still depends on the car.
        await db.insert(rides).values({
            driverId: user.id,
            carId: car.id,
            departureAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            rideStatus: "PLANNED",
            offeredSeats: 3,
            currency: "EUR",
        });

        await expect(
            CarService.deleteCar(car.id, user.id)
        ).rejects.toMatchObject({ code: CarErrorCodes.CarInUse });

        // The soft-delete must have rolled back — the car is still listed.
        const cars = await CarService.getCarsByUserId(user.id);
        expect(cars.map((c) => c.id)).toContain(car.id);
    });
});

describe("CarService.updateCarStatus", () => {
    it("toggles isActive for the owner", async () => {
        const user = await insertTestUser();
        const car = await createTestCar(user.id);

        const deactivated = await CarService.updateCarStatus(car.id, user.id, {
            isActive: false,
        });
        expect(deactivated.isActive).toBe(false);

        const reactivated = await CarService.updateCarStatus(car.id, user.id, {
            isActive: true,
        });
        expect(reactivated.isActive).toBe(true);
    });

    it("throws CarNotFound when a different user tries to update", async () => {
        const owner = await insertTestUser();
        const stranger = await insertTestUser();
        const car = await createTestCar(owner.id);

        await expect(
            CarService.updateCarStatus(car.id, stranger.id, { isActive: false })
        ).rejects.toMatchObject({ code: CarErrorCodes.CarNotFound });
    });

    it("throws CarNotFound for a soft-deleted car", async () => {
        const user = await insertTestUser();
        const car = await createTestCar(user.id);
        await CarService.deleteCar(car.id, user.id);

        await expect(
            CarService.updateCarStatus(car.id, user.id, { isActive: true })
        ).rejects.toMatchObject({ code: CarErrorCodes.CarNotFound });
    });
});

describe("CarService.getCarsByUserId", () => {
    it("returns only the requester's cars", async () => {
        const owner = await insertTestUser();
        const otherUser = await insertTestUser();
        const ownCar = await createTestCar(owner.id);
        await createTestCar(otherUser.id);

        const cars = await CarService.getCarsByUserId(owner.id);

        expect(cars).toHaveLength(1);
        expect(cars[0]!.id).toBe(ownCar.id);
        expect(cars[0]!.ownerId).toBe(owner.id);
        // CarListItem joins car_models — brand/modelName must be populated.
        expect(cars[0]!.brand).toBeTruthy();
        expect(cars[0]!.modelName).toBeTruthy();
    });

    it("returns an empty array for a user with no cars", async () => {
        const user = await insertTestUser();
        const cars = await CarService.getCarsByUserId(user.id);
        expect(cars).toEqual([]);
    });

    it("excludes soft-deleted cars", async () => {
        const user = await insertTestUser();
        const kept = await createTestCar(user.id);
        const removed = await createTestCar(user.id);
        await CarService.deleteCar(removed.id, user.id);

        const cars = await CarService.getCarsByUserId(user.id);
        expect(cars.map((c) => c.id)).toEqual([kept.id]);
    });
});

describe("CarService brand/model lookups", () => {
    it("returns the list of distinct brand names from seed data", async () => {
        const brands = await CarService.getAllCarBrandNames();

        expect(brands.length).toBeGreaterThan(0);
        // cars-data.json seeds Škoda, so it must appear in the lookup.
        expect(brands.map((b) => b.brand)).toContain("Škoda");
    });

    it("returns the models for a known brand", async () => {
        const models = await CarService.getCarModelsByBrand("Škoda");

        expect(models.length).toBeGreaterThan(0);
        for (const model of models) {
            expect(model.brand).toBe("Škoda");
        }
    });

    it("returns an empty array for an unknown brand", async () => {
        const models = await CarService.getCarModelsByBrand(
            "Definitely-Not-A-Real-Brand"
        );
        expect(models).toEqual([]);
    });
});
