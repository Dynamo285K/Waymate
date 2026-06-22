import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../../i18n";
import { ReportStatusActions } from "./ReportStatusActions";

describe("ReportStatusActions", () => {
    it("offers every transition from OPEN", () => {
        render(
            <ReportStatusActions
                status="OPEN"
                isMutating={false}
                onRequestStatus={vi.fn()}
            />
        );
        expect(
            screen.getByRole("button", { name: "Mark investigating" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Mark resolved" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Dismiss" })
        ).toBeInTheDocument();
    });

    it("hides 'investigating' once already investigating", () => {
        render(
            <ReportStatusActions
                status="INVESTIGATING"
                isMutating={false}
                onRequestStatus={vi.fn()}
            />
        );
        expect(
            screen.queryByRole("button", { name: "Mark investigating" })
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Mark resolved" })
        ).toBeInTheDocument();
    });

    it("renders nothing for terminal states", () => {
        const { container: resolved } = render(
            <ReportStatusActions
                status="RESOLVED"
                isMutating={false}
                onRequestStatus={vi.fn()}
            />
        );
        expect(resolved).toBeEmptyDOMElement();

        const { container: dismissed } = render(
            <ReportStatusActions
                status="DISMISSED"
                isMutating={false}
                onRequestStatus={vi.fn()}
            />
        );
        expect(dismissed).toBeEmptyDOMElement();
    });

    it("fires the callback with the chosen target status", async () => {
        const onRequestStatus = vi.fn();
        render(
            <ReportStatusActions
                status="OPEN"
                isMutating={false}
                onRequestStatus={onRequestStatus}
            />
        );
        await userEvent.click(
            screen.getByRole("button", { name: "Mark resolved" })
        );
        expect(onRequestStatus).toHaveBeenCalledWith("RESOLVED");
    });

    it("disables the actions while a mutation is in flight", () => {
        render(
            <ReportStatusActions
                status="OPEN"
                isMutating={true}
                onRequestStatus={vi.fn()}
            />
        );
        expect(
            screen.getByRole("button", { name: "Mark resolved" })
        ).toBeDisabled();
    });
});
