import { db } from "../../db";
import { normalizeForSearch } from "../../shared/text-normalize";
import { CityRepository } from "./city.repository";
import type { SearchCitiesQuery } from "@repo/shared";
import type { CityListItem } from "./city.types";

const searchCities = async (
    query: SearchCitiesQuery
): Promise<CityListItem[]> => {
    // Server-side normalization mirrors what the seed wrote into
    // `name_normalized`. If the input collapses to empty (e.g. a single
    // standalone combining mark that Zod's .min(1) lets through), there
    // is no usable search key — return [] so the autocomplete just shows
    // "no results" instead of bubbling an error to the user.
    const normalizedPrefix = normalizeForSearch(query.q);
    if (!normalizedPrefix) {
        return [];
    }

    return await CityRepository.findCitiesByPrefix(
        db,
        normalizedPrefix,
        query.country,
        query.limit
    );
};

export const CityService = {
    searchCities,
};
