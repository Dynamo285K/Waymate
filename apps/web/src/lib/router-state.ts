import type { UpcomingRide } from "../features/passenger/types";

declare module "@tanstack/react-router" {
    interface HistoryState {
        ride?: {
            id: string;
            from: string;
            to: string;
            price?: number;
            datetime?: string;
        };
        bookedRide?: UpcomingRide;
        role?: "passenger" | "driver";
    }
}
