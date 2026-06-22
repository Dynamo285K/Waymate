import { isNull, sql } from "drizzle-orm";
import { rides as ridesTable } from "../../db/schema/ride";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { cars as carsTable } from "../../db/schema/car";
import { blocklist as blocklistTable } from "../../db/schema/blocklist";

// Soft-delete predicates shared across the ride repository sub-modules.
export const rideNotSoftDeleted = isNull(ridesTable.deletedAt);
export const bookingNotSoftDeleted = isNull(bookingsTable.deletedAt);
export const carNotSoftDeleted = isNull(carsTable.deletedAt);

// SQL fragment that excludes rides whose driver is in an active block (either
// direction) with the viewer. Returns undefined for anonymous searches (no
// viewer), and `and(...)` simply skips undefined conditions.
export const driverNotBlockedForViewer = (viewerId: string | undefined) =>
    viewerId
        ? sql`NOT EXISTS (
            SELECT 1 FROM ${blocklistTable} bl
            WHERE bl.block_status = 'ACTIVE'
              AND bl.revoked_at IS NULL
              AND bl.deleted_at IS NULL
              AND (
                (bl.blocker_user_id = ${viewerId} AND bl.blocked_user_id = ${ridesTable.driverId})
                OR (bl.blocked_user_id = ${viewerId} AND bl.blocker_user_id = ${ridesTable.driverId})
              )
          )`
        : undefined;
