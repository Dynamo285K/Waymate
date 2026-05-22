import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Library does not auto-unmount between tests under Vitest.
afterEach(() => {
    cleanup();
});
