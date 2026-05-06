import { timestamp } from "drizzle-orm/pg-core";

// Domain tables use `timestamp(6) with time zone` so writers in
// different locales serialise into UTC. Mirrors the precision/tz
// shape better-auth requires for accounts/sessions/verifications.
// See documentation/schema-audit.md §2.
export const timestamptz = (name: string) =>
    timestamp(name, { precision: 6, withTimezone: true });
