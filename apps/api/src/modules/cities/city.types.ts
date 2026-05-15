import type { InferSelectModel } from "drizzle-orm";
import type { cities } from "../../db/schema/city";

// ==========================================
// 1. BASE DATABASE TYPES (SELECT)
// ==========================================
export type City = InferSelectModel<typeof cities>;

// ==========================================
// 2. COMPOSITE TYPES (SERVICE / REPOSITORY)
// ==========================================
// Public projection — drops the GeoNames-internal `external_id` and
// `name_normalized` (search key, not for display) plus timestamps.
export type CityListItem = Pick<
    City,
    "id" | "name" | "countryCode" | "lat" | "lng" | "population"
>;
