/* eslint-disable no-restricted-syntax -- the RideCard mock below uses raw
   <button> elements purely as click targets for assertions; the design-system
   Button is not relevant to this test scaffolding. */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../../i18n";
import { DriverRideList } from "./DriverRideList";
import type { DriverDisplayedRide } from "../-lib/driver-ride-view";

// Stub RideCard so the tests assert this component's wiring and the per-ride
// complete/cancel guards rather than the @waymate/ui card internals.
vi.mock("../../../../components/shared/RideCard", () => ({
    RideCard: (props: {
        variant: string;
        onViewPassengers?: () => void;
        onCompleteRide?: () => void;
        onCancelRide?: () => void;
        onRatePassengers?: () => void;
        labels?: { completeRide?: string; cancelRide?: string };
    }) => (
        <div data-testid="ride-card" data-variant={props.variant}>
            {props.onViewPassengers && (
                <button onClick={props.onViewPassengers}>view</button>
            )}
            {props.onCompleteRide && (
                <button onClick={props.onCompleteRide}>complete</button>
            )}
            {props.onCancelRide && (
                <button onClick={props.onCancelRide}>cancel</button>
            )}
            {props.onRatePassengers && (
                <button onClick={props.onRatePassengers}>rate</button>
            )}
            <span data-testid="complete-label">
                {props.labels?.completeRide}
            </span>
            <span data-testid="cancel-label">{props.labels?.cancelRide}</span>
        </div>
    ),
}));

const PAST = "2020-01-01T08:00:00.000Z";
const FUTURE = "2999-01-01T08:00:00.000Z";

function makeRide(overrides: Partial<DriverDisplayedRide> = {}): DriverDisplayedRide {
    return {
        id: "r1",
        from: "Bratislava",
        to: "Košice",
        date: PAST,
        price: 15,
        seatsLeft: 2,
        rideStatus: "PLANNED",
        duration: "2h",
        ...overrides,
    };
}

const noop = () => {};

function renderList(props: Partial<Parameters<typeof DriverRideList>[0]>) {
    return render(
        <DriverRideList
            isLoading={false}
            isError={false}
            error={null}
            tab="upcoming"
            rides={[]}
            cancellingRideId={null}
            isCancelPending={false}
            isCompletePending={false}
            rideToComplete={null}
            onViewPassengers={noop}
            onCompleteRide={noop}
            onCancelRide={noop}
            onRatePassengers={noop}
            {...props}
        />
    );
}

describe("DriverRideList", () => {
    it("shows loading / error / empty states", () => {
        const { rerender } = renderList({ isLoading: true });
        expect(screen.getByText("Loading rides...")).toBeInTheDocument();

        rerender(
            <DriverRideList
                isLoading={false}
                isError
                error={new Error("boom")}
                tab="upcoming"
                rides={[]}
                cancellingRideId={null}
                isCancelPending={false}
                isCompletePending={false}
                rideToComplete={null}
                onViewPassengers={noop}
                onCompleteRide={noop}
                onCancelRide={noop}
                onRatePassengers={noop}
            />
        );
        expect(
            screen.getByText("Failed to load your rides. Please try again.")
        ).toBeInTheDocument();

        rerender(
            <DriverRideList
                isLoading={false}
                isError={false}
                error={null}
                tab="upcoming"
                rides={[]}
                cancellingRideId={null}
                isCancelPending={false}
                isCompletePending={false}
                rideToComplete={null}
                onViewPassengers={noop}
                onCompleteRide={noop}
                onCancelRide={noop}
                onRatePassengers={noop}
            />
        );
        expect(screen.getByText("No rides found.")).toBeInTheDocument();
    });

    it("offers complete + cancel for an active, departed upcoming ride", async () => {
        const onViewPassengers = vi.fn();
        const onCompleteRide = vi.fn();
        const onCancelRide = vi.fn();
        renderList({
            rides: [makeRide()],
            onViewPassengers,
            onCompleteRide,
            onCancelRide,
        });

        expect(screen.getByTestId("ride-card")).toHaveAttribute(
            "data-variant",
            "driver-upcoming"
        );
        await userEvent.click(screen.getByText("view"));
        await userEvent.click(screen.getByText("complete"));
        await userEvent.click(screen.getByText("cancel"));

        expect(onViewPassengers).toHaveBeenCalledWith(makeRide());
        expect(onCompleteRide).toHaveBeenCalledWith("r1");
        expect(onCancelRide).toHaveBeenCalledWith("r1");
    });

    it("hides complete before departure but keeps cancel", () => {
        renderList({ rides: [makeRide({ date: FUTURE })] });
        expect(screen.queryByText("complete")).not.toBeInTheDocument();
        expect(screen.getByText("cancel")).toBeInTheDocument();
    });

    it("hides both complete and cancel once the ride is completed", () => {
        renderList({ rides: [makeRide({ rideStatus: "COMPLETED" })] });
        expect(screen.queryByText("complete")).not.toBeInTheDocument();
        expect(screen.queryByText("cancel")).not.toBeInTheDocument();
    });

    it("swaps in the pending labels while completing / cancelling", () => {
        renderList({
            rides: [makeRide()],
            isCompletePending: true,
            rideToComplete: null,
            isCancelPending: true,
            cancellingRideId: "r1",
        });
        expect(screen.getByTestId("complete-label")).toHaveTextContent(
            "Completing..."
        );
        expect(screen.getByTestId("cancel-label")).toHaveTextContent(
            "Cancelling..."
        );
    });

    it("renders past rides with a rate-passengers action", async () => {
        const onRatePassengers = vi.fn();
        renderList({
            tab: "past",
            rides: [makeRide()],
            onRatePassengers,
        });
        expect(screen.getByTestId("ride-card")).toHaveAttribute(
            "data-variant",
            "driver-past"
        );
        await userEvent.click(screen.getByText("rate"));
        expect(onRatePassengers).toHaveBeenCalledWith(makeRide());
        expect(screen.queryByText("complete")).not.toBeInTheDocument();
    });
});
