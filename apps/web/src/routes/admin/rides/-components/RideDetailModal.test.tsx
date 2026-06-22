import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../i18n";
import type { RideStatus } from "../../../../api-client/model/rideStatus";
import type { AdminRideDetailResponse } from "../../../../api-client/model/adminRideDetailResponse";

// The modal pulls its data straight from the generated query hook, so we mock
// it to render a ride in an arbitrary status without a network/QueryClient.
const useGetRidesAdminById = vi.fn();
vi.mock("../../../../api-client/rides/rides", () => ({
    useGetRidesAdminById: (id: string) => useGetRidesAdminById(id),
}));

import { RideDetailModal } from "./RideDetailModal";

function makeResponse(rideStatus: RideStatus): AdminRideDetailResponse {
    return {
        ride: {
            id: "ride-1",
            rideStatus,
            departureAt: "2026-07-01T08:00:00.000Z",
            arrivalEstimateAt: null,
            autoEndAt: null,
            endedAt: null,
            endedByUserId: null,
            endSource: null,
            endReason: null,
            autoEndProcessedAt: null,
            offeredSeats: 3,
            currency: "EUR",
            description: null,
            createdAt: "2026-06-01T08:00:00.000Z",
            updatedAt: "2026-06-01T08:00:00.000Z",
            driver: {
                id: "driver-1",
                firstName: "Driver",
                lastName: "One",
                profilePhotoUrl: null,
                email: "driver@example.com",
                userStatus: "ACTIVE",
            },
            car: {
                id: "car-1",
                spz: "BA123AB",
                brand: "Skoda",
                modelName: "Octavia",
            },
            stops: [
                {
                    id: "stop-0",
                    stopOrder: 0,
                    address: "Main 1",
                    city: "Bratislava",
                    countryCode: "SK",
                    plannedArrivalAt: null,
                    plannedDepartureAt: null,
                },
                {
                    id: "stop-1",
                    stopOrder: 1,
                    address: "Main 2",
                    city: "Brno",
                    countryCode: "CZ",
                    plannedArrivalAt: null,
                    plannedDepartureAt: null,
                },
            ],
            prices: [],
            bookings: [],
        },
        statusHistory: [],
    } as AdminRideDetailResponse;
}

function renderWithStatus(rideStatus: RideStatus) {
    useGetRidesAdminById.mockReturnValue({
        data: makeResponse(rideStatus),
        isLoading: false,
        isError: false,
        error: null,
    });
    return render(
        <RideDetailModal
            theme="light"
            rideId="ride-1"
            isThisRideMutating={false}
            mutationErrorForThisRide={null}
            onClose={() => {}}
            onRequestCancel={() => {}}
        />
    );
}

describe("RideDetailModal force cancel button", () => {
    it("is enabled for a PLANNED ride", () => {
        renderWithStatus("PLANNED");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeEnabled();
    });

    it("is disabled for a COMPLETED ride", () => {
        renderWithStatus("COMPLETED");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeDisabled();
    });

    it("is disabled for an IN_PROGRESS ride", () => {
        renderWithStatus("IN_PROGRESS");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeDisabled();
    });

    it("is disabled for an already CANCELLED ride", () => {
        renderWithStatus("CANCELLED");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeDisabled();
    });
});
