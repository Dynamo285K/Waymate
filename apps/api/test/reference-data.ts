import { cities } from "../src/db/schema";

export const TEST_CITY_IDS = {
    bratislava: "00000000-0000-4000-8000-000000000001",
    banskaBystrica: "00000000-0000-4000-8000-000000000002",
} as const;

export const TEST_CITIES = [
    {
        id: TEST_CITY_IDS.bratislava,
        externalId: 3060972,
        name: "Bratislava",
        nameNormalized: "bratislava",
        countryCode: "SK",
        lat: 48.148,
        lng: 17.107,
        population: 475_503,
    },
    {
        id: TEST_CITY_IDS.banskaBystrica,
        externalId: 3061186,
        name: "Banska Bystrica",
        nameNormalized: "banska bystrica",
        countryCode: "SK",
        lat: 48.736,
        lng: 19.146,
        population: 76_438,
    },
] satisfies (typeof cities.$inferInsert)[];
