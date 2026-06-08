import { RideService } from "./apps/api/src/modules/rides/ride.service";

async function main() {
    try {
        const result = await RideService.searchRides({
            startCity: "Slavkov",
            startLat: 49.15,
            startLng: 16.88,
            destCity: "Brno",
            destLat: 49.2,
            destLng: 16.6,
            travelDate: new Date("2026-06-07T08:00:00Z"),
        });
        console.log("Success:", result);
    } catch (err) {
        console.error("Error:", err);
    }
    process.exit(0);
}

main();
