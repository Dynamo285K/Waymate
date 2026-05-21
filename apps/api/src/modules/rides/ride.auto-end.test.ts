import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RideService } from "./ride.service";
import { startRideAutoEndWorker } from "./ride.auto-end";

const EMPTY_RESULT = {
    candidates: 0,
    processed: 0,
    failed: 0,
    failures: [] as { rideId: string; error: string }[],
};

// The worker's orchestration is tested in isolation: RideService.autoEndExpiredRides
// is stubbed so these cases exercise only the scheduling, the in-flight overlap
// guard, error handling, and stop logic — not the DB-backed termination itself
// (that is covered in ride.service.test.ts). Fake timers drive the interval.
describe("startRideAutoEndWorker", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("does not run or schedule anything when disabled", async () => {
        const autoEnd = vi.spyOn(RideService, "autoEndExpiredRides");

        const worker = startRideAutoEndWorker({ enabled: false });
        await worker.runOnce();
        await vi.advanceTimersByTimeAsync(5 * 60_000);

        expect(autoEnd).not.toHaveBeenCalled();
        // stop() on a disabled worker is a safe no-op.
        expect(() => worker.stop()).not.toThrow();
    });

    it("runs once immediately on start with the configured batch size", async () => {
        const autoEnd = vi
            .spyOn(RideService, "autoEndExpiredRides")
            .mockResolvedValue(EMPTY_RESULT);

        const worker = startRideAutoEndWorker({
            enabled: true,
            intervalMs: 60_000,
            batchSize: 7,
        });
        await vi.advanceTimersByTimeAsync(0);

        expect(autoEnd).toHaveBeenCalledTimes(1);
        expect(autoEnd).toHaveBeenCalledWith({ limit: 7 });

        worker.stop();
    });

    it("keeps running on the configured interval", async () => {
        const autoEnd = vi
            .spyOn(RideService, "autoEndExpiredRides")
            .mockResolvedValue(EMPTY_RESULT);

        const worker = startRideAutoEndWorker({
            enabled: true,
            intervalMs: 60_000,
            batchSize: 50,
        });
        await vi.advanceTimersByTimeAsync(0); // immediate run
        await vi.advanceTimersByTimeAsync(60_000); // interval tick 1
        await vi.advanceTimersByTimeAsync(60_000); // interval tick 2

        expect(autoEnd).toHaveBeenCalledTimes(3);

        worker.stop();
    });

    it("skips an interval tick while a previous run is still in flight", async () => {
        let releaseFirstRun!: () => void;
        const firstRunGate = new Promise<void>((resolve) => {
            releaseFirstRun = resolve;
        });
        const autoEnd = vi
            .spyOn(RideService, "autoEndExpiredRides")
            .mockImplementationOnce(async () => {
                await firstRunGate;
                return EMPTY_RESULT;
            })
            .mockResolvedValue(EMPTY_RESULT);

        const worker = startRideAutoEndWorker({
            enabled: true,
            intervalMs: 60_000,
            batchSize: 50,
        });
        await vi.advanceTimersByTimeAsync(0); // immediate run starts, stays in flight
        expect(autoEnd).toHaveBeenCalledTimes(1);

        // The interval fires while the first run has not resolved — the overlap
        // guard must skip it instead of starting a concurrent run.
        await vi.advanceTimersByTimeAsync(60_000);
        expect(autoEnd).toHaveBeenCalledTimes(1);

        // Once the first run finishes, the next tick runs normally again.
        releaseFirstRun();
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(60_000);
        expect(autoEnd).toHaveBeenCalledTimes(2);

        worker.stop();
    });

    it("swallows a failing run and keeps the worker alive", async () => {
        const autoEnd = vi
            .spyOn(RideService, "autoEndExpiredRides")
            .mockRejectedValueOnce(new Error("database unavailable"))
            .mockResolvedValue(EMPTY_RESULT);

        const worker = startRideAutoEndWorker({
            enabled: true,
            intervalMs: 60_000,
            batchSize: 50,
        });

        // The immediate run rejects; the worker must not throw and the
        // in-flight guard must be cleared so the next tick still runs.
        await vi.advanceTimersByTimeAsync(0);
        expect(autoEnd).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(60_000);
        expect(autoEnd).toHaveBeenCalledTimes(2);

        worker.stop();
    });

    it("stop() halts the interval and turns runOnce into a no-op", async () => {
        const autoEnd = vi
            .spyOn(RideService, "autoEndExpiredRides")
            .mockResolvedValue(EMPTY_RESULT);

        const worker = startRideAutoEndWorker({
            enabled: true,
            intervalMs: 60_000,
            batchSize: 50,
        });
        await vi.advanceTimersByTimeAsync(0);
        expect(autoEnd).toHaveBeenCalledTimes(1);

        worker.stop();

        await vi.advanceTimersByTimeAsync(10 * 60_000);
        await worker.runOnce();

        expect(autoEnd).toHaveBeenCalledTimes(1);
    });
});
