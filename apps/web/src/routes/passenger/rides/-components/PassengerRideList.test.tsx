/* eslint-disable no-restricted-syntax -- the RideCard mock below uses raw
   <button> elements purely as click targets for assertions; the design-system
   Button is not relevant to this test scaffolding. */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../../i18n";
import { PassengerRideList } from "./PassengerRideList";
import type { DisplayedRide } from "../-lib/passenger-ride-view";

// Stub RideCard so the tests assert this component's wiring (which callbacks it
// passes, with which arguments) rather than the @waymate/ui card internals. The
// stub renders a button per provided callback so absent callbacks are testable.
vi.mock("../../../../components/shared/RideCard", () => ({
    RideCard: (props: {
        variant: string;
        from: string;
        to: string;
        onSendMessage?: () => void;
        onCancelBooking?: () => void;
        onRateDriver?: () => void;
        onReport?: () => void;
    }) => (
        <div data-testid="ride-card" data-variant={props.variant}>
            <span>
                {props.from} → {props.to}
            </span>
            {props.onSendMessage && (
                <button onClick={props.onSendMessage}>message</button>
            )}
            {props.onCancelBooking && (
                <button onClick={props.onCancelBooking}>cancel-booking</button>
            )}
            {props.onRateDriver && (
                <button onClick={props.onRateDriver}>rate</button>
            )}
            {props.onReport && <button onClick={props.onReport}>report</button>}
        </div>
    ),
}));

function makeRide(overrides: Partial<DisplayedRide> = {}): DisplayedRide {
    return {
        id: "b1",
        from: "Bratislava",
        to: "Košice",
        date: "2026-01-01T08:00:00.000Z",
        price: 12,
        duration: "1h 30min",
        driverName: "Jane Doe",
        driverRating: 4.5,
        seatsLeft: 2,
        status: "confirmed",
        driverId: "d1",
        rideId: "r1",
        alreadyReviewed: false,
        ...overrides,
    };
}

const noop = () => {};

function renderList(props: Partial<Parameters<typeof PassengerRideList>[0]>) {
    return render(
        <PassengerRideList
            isLoading={false}
            isError={false}
            error={null}
            tab="upcoming"
            rides={[]}
            onSendMessage={noop}
            onCancelBooking={noop}
            onRateDriver={noop}
            onReport={noop}
            {...props}
        />
    );
}

describe("PassengerRideList", () => {
    it("shows the loading message", () => {
        renderList({ isLoading: true });
        expect(screen.getByText("Loading rides...")).toBeInTheDocument();
    });

    it("shows the fallback error message", () => {
        renderList({ isError: true, error: new Error("boom") });
        expect(
            screen.getByText("Failed to load your rides. Please try again.")
        ).toBeInTheDocument();
    });

    it("shows the empty message when there are no rides", () => {
        renderList({ rides: [] });
        expect(screen.getByText("No rides found.")).toBeInTheDocument();
    });

    it("wires message/cancel/report on upcoming cards", async () => {
        const onSendMessage = vi.fn();
        const onCancelBooking = vi.fn();
        const onReport = vi.fn();
        const ride = makeRide();
        renderList({
            tab: "upcoming",
            rides: [ride],
            onSendMessage,
            onCancelBooking,
            onReport,
        });

        const card = screen.getByTestId("ride-card");
        expect(card).toHaveAttribute("data-variant", "passenger-upcoming");

        await userEvent.click(screen.getByText("message"));
        await userEvent.click(screen.getByText("cancel-booking"));
        await userEvent.click(screen.getByText("report"));

        expect(onSendMessage).toHaveBeenCalledWith("b1");
        expect(onCancelBooking).toHaveBeenCalledWith("b1");
        expect(onReport).toHaveBeenCalledWith(ride);
    });

    it("renders past cards with rate + report, not booking actions", () => {
        renderList({ tab: "past", rides: [makeRide()] });
        expect(screen.getByTestId("ride-card")).toHaveAttribute(
            "data-variant",
            "passenger-past"
        );
        expect(screen.getByText("rate")).toBeInTheDocument();
        expect(screen.getByText("report")).toBeInTheDocument();
        expect(screen.queryByText("message")).not.toBeInTheDocument();
    });

    it("omits the report action when the driver or ride id is missing", () => {
        renderList({
            tab: "upcoming",
            rides: [makeRide({ driverId: undefined })],
        });
        expect(screen.queryByText("report")).not.toBeInTheDocument();
    });
});
