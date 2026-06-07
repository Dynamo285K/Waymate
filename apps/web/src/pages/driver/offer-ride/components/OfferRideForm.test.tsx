import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { OfferRideForm } from "./OfferRideForm";
import type { OfferRideFormInput } from "./schema";

// OfferRideForm reads RHF state from context, so tests wrap it in a provider.
function Harness({ onPublishClick }: { onPublishClick?: () => void }) {
    const methods = useForm<OfferRideFormInput>({
        defaultValues: {
            pickupCity: null,
            dropoffCity: null,
            rideDate: undefined,
            rideTime: "",
            seats: "",
            price: "",
            durationHours: "",
            durationMinutes: "",
            manualBrand: "",
            manualModel: "",
            manualPlate: "",
        },
    });
    return (
        <FormProvider {...methods}>
            <OfferRideForm
                car={{
                    savedCars: [],
                    carMode: "manual",
                    onCarModeChange: () => {},
                    selectedCarId: "",
                    onSelectedCarChange: () => {},
                    brandOptions: [],
                    brandLoading: false,
                    modelOptions: [],
                    modelLoading: false,
                }}
                onPublishClick={onPublishClick}
            />
        </FormProvider>
    );
}

describe("OfferRideForm", () => {
    it("renders the form title", () => {
        render(<Harness />);

        expect(
            screen.getByRole("heading", { name: "offerRide.title" })
        ).toBeInTheDocument();
    });

    it("fires onPublishClick when the publish button is pressed", async () => {
        const onPublishClick = vi.fn();
        render(<Harness onPublishClick={onPublishClick} />);

        await userEvent.click(
            screen.getByRole("button", { name: "offerRide.publish" })
        );

        expect(onPublishClick).toHaveBeenCalledOnce();
    });
});
