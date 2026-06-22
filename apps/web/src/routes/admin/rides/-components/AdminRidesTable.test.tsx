import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../../i18n";
import type { RideStatus } from "../../../../api-client/model/rideStatus";
import type { AdminRideListItem } from "../../../../api-client/model/adminRideListItem";
import { AdminRidesTable } from "./AdminRidesTable";

function makeItem(rideStatus: RideStatus): AdminRideListItem {
    return {
        id: "ride-1",
        rideStatus,
        departureAt: "2026-07-01T08:00:00.000Z",
        offeredSeats: 3,
        currency: "EUR",
        originCity: "Bratislava",
        destinationCity: "Brno",
        activeSeatCount: 0,
        driver: {
            id: "driver-1",
            firstName: "Driver",
            lastName: "One",
            email: "driver@example.com",
        },
        createdAt: "2026-06-01T08:00:00.000Z",
    } as AdminRideListItem;
}

function renderTable(rideStatus: RideStatus) {
    return render(
        <AdminRidesTable
            items={[makeItem(rideStatus)]}
            rowMutatingId={null}
            onView={vi.fn()}
            onCancel={vi.fn()}
        />
    );
}

describe("AdminRidesTable force cancel action", () => {
    it("is enabled for a PLANNED ride", () => {
        renderTable("PLANNED");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeEnabled();
    });

    it("is disabled for a COMPLETED ride", () => {
        renderTable("COMPLETED");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeDisabled();
    });

    it("is disabled for an IN_PROGRESS ride", () => {
        renderTable("IN_PROGRESS");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeDisabled();
    });

    it("is disabled for an already CANCELLED ride", () => {
        renderTable("CANCELLED");
        expect(
            screen.getByRole("button", { name: "Force Cancel" })
        ).toBeDisabled();
    });
});
