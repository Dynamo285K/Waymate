import { env } from "../../../config/env";
import { logger } from "../../../shared/logger";
import { RideService } from "../ride.service";

type RideAutoEndWorkerOptions = {
    enabled?: boolean;
    intervalMs?: number;
    batchSize?: number;
};

type RideAutoEndWorker = {
    runOnce: () => Promise<void>;
    stop: () => void;
};

export const startRideAutoEndWorker = (
    options: RideAutoEndWorkerOptions = {}
): RideAutoEndWorker => {
    const enabled = options.enabled ?? env.RIDE_AUTO_END_ENABLED;
    const intervalMs = options.intervalMs ?? env.RIDE_AUTO_END_INTERVAL_MS;
    const batchSize = options.batchSize ?? env.RIDE_AUTO_END_BATCH_SIZE;

    if (!enabled) {
        logger.info("ride_auto_end_worker_disabled");
        return {
            runOnce: async () => {},
            stop: () => {},
        };
    }

    let isRunning = false;
    let isStopped = false;

    const runOnce = async () => {
        if (isStopped) return;
        if (isRunning) {
            logger.warn("ride_auto_end_worker_overlap_skipped");
            return;
        }

        isRunning = true;
        try {
            const result = await RideService.autoEndExpiredRides({
                limit: batchSize,
            });

            if (result.candidates > 0 || result.failed > 0) {
                logger.info(
                    {
                        candidates: result.candidates,
                        processed: result.processed,
                        failed: result.failed,
                    },
                    "ride_auto_end_worker_run"
                );
            }

            if (result.failures.length > 0) {
                logger.warn(
                    { failures: result.failures },
                    "ride_auto_end_worker_partial_failure"
                );
            }
        } catch (error) {
            logger.error({ err: error }, "ride_auto_end_worker_failed");
        } finally {
            isRunning = false;
        }
    };

    const timer = setInterval(() => {
        void runOnce();
    }, intervalMs);

    void runOnce();

    return {
        runOnce,
        stop: () => {
            isStopped = true;
            clearInterval(timer);
        },
    };
};
