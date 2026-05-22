import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferRideForm } from "./OfferRideForm";

describe("OfferRideForm", () => {
    it("renders with its default labels", () => {
        render(<OfferRideForm />);

        expect(
            screen.getByRole("heading", { name: "Offer a ride" })
        ).toBeInTheDocument();
    });

    it("fires onPublishClick when the publish button is pressed", async () => {
        const onPublishClick = vi.fn();
        render(<OfferRideForm onPublishClick={onPublishClick} />);

        await userEvent.click(
            screen.getByRole("button", { name: /publish ride/i })
        );

        expect(onPublishClick).toHaveBeenCalledOnce();
    });
});
