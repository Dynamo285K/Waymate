import { describe, expect, it } from "vitest";
import { getErrorCode, getErrorI18nKey } from "./api-errors";
import { ApiError, NetworkError } from "./api-fetcher";

const res = {} as Response;
const apiError = (status: number, data: unknown) =>
    new ApiError(status, data, res);

describe("getErrorCode", () => {
    it("extracts the code from a standard ApiError body", () => {
        expect(getErrorCode(apiError(400, { error: "RIDE_NOT_FOUND" }))).toBe(
            "RIDE_NOT_FOUND"
        );
    });

    it("returns null for an ApiError without the { error } shape", () => {
        expect(getErrorCode(apiError(400, { message: "nope" }))).toBeNull();
        expect(getErrorCode(apiError(400, "string body"))).toBeNull();
    });

    it("returns null for non-ApiError values", () => {
        expect(getErrorCode(new NetworkError(new Error("offline")))).toBeNull();
        expect(getErrorCode(new Error("plain"))).toBeNull();
        expect(getErrorCode(null)).toBeNull();
    });
});

describe("getErrorI18nKey", () => {
    const map = { RIDE_ALREADY_DEPARTED: "admin.errors.rideAlreadyDeparted" };

    it("prefers a page-specific mapped key when the code matches", () => {
        expect(
            getErrorI18nKey(
                apiError(400, { error: "RIDE_ALREADY_DEPARTED" }),
                map
            )
        ).toBe("admin.errors.rideAlreadyDeparted");
    });

    it("falls back to a generic key based on HTTP status", () => {
        expect(getErrorI18nKey(apiError(401, { error: "X" }), map)).toBe(
            "errors.unauthorized"
        );
        expect(getErrorI18nKey(apiError(403, { error: "X" }), map)).toBe(
            "errors.forbidden"
        );
        expect(getErrorI18nKey(apiError(404, { error: "X" }), map)).toBe(
            "errors.notFound"
        );
        expect(getErrorI18nKey(apiError(400, { error: "X" }), map)).toBe(
            "errors.validation"
        );
        expect(getErrorI18nKey(apiError(503, { error: "X" }), map)).toBe(
            "errors.server"
        );
    });

    it("maps NetworkError to the offline key", () => {
        expect(
            getErrorI18nKey(new NetworkError(new Error("offline")), map)
        ).toBe("errors.network");
    });

    it("uses the fallback for anything unrecognised", () => {
        expect(getErrorI18nKey(new Error("plain"), map)).toBe("errors.unknown");
        expect(getErrorI18nKey(undefined, map, "errors.custom")).toBe(
            "errors.custom"
        );
    });
});
