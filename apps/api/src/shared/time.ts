// Time-zone aware day boundaries.
//
// Ride search takes a calendar date and must match rides departing on *that
// day* as people experience it locally — not on the server's day, which on a
// UTC host is shifted 1–2h from CET/CEST and silently drops early/late rides.
//
// `BUSINESS_TIME_ZONE` is the single place the product's "local day" is defined.
// Promote it to an env var if the service ever spans multiple regions.
export const BUSINESS_TIME_ZONE = "Europe/Bratislava";

// Offset (in ms) to add to a UTC instant to get the wall-clock time in `tz`.
// Derived by formatting the instant in `tz` and diffing against the same
// components read as UTC — DST-correct because Intl applies the rule in effect
// at that instant.
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const parts: Record<string, number> = {};
    for (const part of dtf.formatToParts(instant)) {
        if (part.type !== "literal") parts[part.type] = Number(part.value);
    }

    // Intl renders midnight as hour "24" with hour12:false; normalize to 0.
    const asUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour % 24,
        parts.minute,
        parts.second
    );

    // Drop sub-second precision on the instant side so the diff is whole ms.
    return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// Resolves wall-clock components in `timeZone` to the corresponding UTC instant,
// correcting for that zone's offset at that moment (handles DST transitions).
function zonedWallTimeToUtc(
    year: number,
    month: number, // 1-12
    day: number,
    hour: number,
    minute: number,
    second: number,
    ms: number,
    timeZone: string
): Date {
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
    const offset = timeZoneOffsetMs(new Date(utcGuess), timeZone);
    return new Date(utcGuess - offset);
}

/**
 * Returns the half-open-ish [start, end] UTC instants bounding the calendar day
 * that `instant` falls on in `timeZone`. `start` is 00:00:00.000 local, `end`
 * is 23:59:59.999 local — both expressed as UTC `Date`s for direct comparison
 * against `timestamptz` columns.
 */
export function dayBoundsInTimeZone(
    instant: Date,
    timeZone: string = BUSINESS_TIME_ZONE
): { start: Date; end: Date } {
    const ymd = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(instant);
    const [year, month, day] = ymd.split("-").map(Number);

    return {
        start: zonedWallTimeToUtc(year, month, day, 0, 0, 0, 0, timeZone),
        end: zonedWallTimeToUtc(year, month, day, 23, 59, 59, 999, timeZone),
    };
}
