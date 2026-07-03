import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom doesn't implement scrollIntoView; stub it so components that auto-scroll
// to a ref on mount (e.g. the chat thread) can render under tests.
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
}

// jsdom lacks the pointer-capture API that Radix menus/popovers call — without
// these stubs opening a DropdownMenu crashes the test worker.
if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
}

// React Testing Library does not auto-unmount between tests under Vitest.
afterEach(() => {
    cleanup();
});
