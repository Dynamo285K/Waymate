import { describe, expect, it } from "vitest";
import { fullName, formatDate, formatPrice } from "./admin-format";

describe("fullName", () => {
    it("joins first and last name", () => {
        expect(fullName("Ada", "Lovelace")).toBe("Ada Lovelace");
    });

    it("drops missing parts without leaving stray whitespace", () => {
        expect(fullName(null, "Lovelace")).toBe("Lovelace");
        expect(fullName("Ada", undefined)).toBe("Ada");
        expect(fullName(null, null)).toBe("");
    });
});

describe("formatDate", () => {
    it("returns the fallback for empty or invalid input", () => {
        expect(formatDate(null, "—")).toBe("—");
        expect(formatDate(undefined, "—")).toBe("—");
        expect(formatDate("not-a-date", "—")).toBe("—");
    });

    it("formats a valid ISO timestamp", () => {
        const out = formatDate("2026-07-01T08:00:00.000Z", "—");
        expect(out).not.toBe("—");
        expect(out).toContain("2026");
    });
});

describe("formatPrice", () => {
    it("renders the amount in the given currency", () => {
        expect(formatPrice(10, "EUR")).toContain("10");
    });

    it("falls back to a plain string for an invalid currency code", () => {
        expect(formatPrice(10, "NOTACURRENCY")).toBe("10 NOTACURRENCY");
    });
});
