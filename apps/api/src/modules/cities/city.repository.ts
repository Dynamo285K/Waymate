import { and, desc, eq, inArray, like } from "drizzle-orm";
import type { Executor } from "../../db";
import { cities as citiesTable } from "../../db/schema/city";
import type { CountryCode } from "@repo/shared";
import type { CityListItem } from "./city.types";

const findCitiesByPrefix = async (
    executor: Executor,
    normalizedPrefix: string,
    country: CountryCode | undefined,
    limit: number
): Promise<CityListItem[]> => {
    // `name_normalized` is already lowercase ASCII (see normalizeForSearch
    // + the seed script), so plain LIKE is enough — no ILIKE needed and
    // the cities_name_normalized_trgm_idx (gin_trgm_ops) speeds it up.
    const filters = [like(citiesTable.nameNormalized, `${normalizedPrefix}%`)];
    if (country) {
        filters.push(eq(citiesTable.countryCode, country));
    }

    const rows = await executor
        .select({
            id: citiesTable.id,
            name: citiesTable.name,
            countryCode: citiesTable.countryCode,
            lat: citiesTable.lat,
            lng: citiesTable.lng,
            population: citiesTable.population,
        })
        .from(citiesTable)
        .where(and(...filters))
        .orderBy(desc(citiesTable.population), citiesTable.name)
        .limit(limit);

    return rows;
};

const findCitiesByIds = async (
    executor: Executor,
    ids: string[]
): Promise<CityListItem[]> => {
    if (ids.length === 0) return [];
    return await executor
        .select({
            id: citiesTable.id,
            name: citiesTable.name,
            countryCode: citiesTable.countryCode,
            lat: citiesTable.lat,
            lng: citiesTable.lng,
            population: citiesTable.population,
        })
        .from(citiesTable)
        .where(inArray(citiesTable.id, ids));
};

export const CityRepository = {
    findCitiesByPrefix,
    findCitiesByIds,
};
