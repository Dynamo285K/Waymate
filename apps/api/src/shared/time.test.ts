import { describe, it, expect } from "vitest";
import { dayBoundsInTimeZone } from "./time";

describe("dayBoundsInTimeZone (Europe/Bratislava)", () => {
    it("bounds a summer (CEST, UTC+2) day in local time", () => {
        const { start, end } = dayBoundsInTimeZone(
            new Date("2026-06-15T10:00:00Z"),
            "Europe/Bratislava"
        );
        // 00:00 CEST == 22:00Z the previous day; 23:59:59.999 CEST == 21:59:59.999Z.
        expect(start.toISOString()).toBe("2026-06-14T22:00:00.000Z");
        expect(end.toISOString()).toBe("2026-06-15T21:59:59.999Z");
    });

    it("bounds a winter (CET, UTC+1) day in local time", () => {
        const { start, end } = dayBoundsInTimeZone(
            new Date("2026-01-15T10:00:00Z"),
            "Europe/Bratislava"
        );
        expect(start.toISOString()).toBe("2026-01-14T23:00:00.000Z");
        expect(end.toISOString()).toBe("2026-01-15T22:59:59.999Z");
    });

    it("uses the local calendar day, not the UTC day, near midnight", () => {
        // 23:30Z on Jun 14 is already 01:30 on Jun 15 in CEST, so the day is
        // the 15th — the exact case the old setHours() logic got wrong on a
        // UTC host.
        const { start, end } = dayBoundsInTimeZone(
            new Date("2026-06-14T23:30:00Z"),
            "Europe/Bratislava"
        );
        expect(start.toISOString()).toBe("2026-06-14T22:00:00.000Z");
        expect(end.toISOString()).toBe("2026-06-15T21:59:59.999Z");
    });
});
