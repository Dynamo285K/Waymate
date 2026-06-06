import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

describe("RouteErrorBoundary", () => {
    it("renders the fallback message", () => {
        render(
            <RouteErrorBoundary
                error={new Error("boom")}
                reset={vi.fn()}
            />
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("calls reset when 'Try again' is pressed", async () => {
        const reset = vi.fn();
        render(
            <RouteErrorBoundary
                error={new Error("boom")}
                reset={reset}
            />
        );

        await userEvent.click(
            screen.getByRole("button", { name: /try again/i })
        );

        expect(reset).toHaveBeenCalledOnce();
    });
});
