import { z } from "zod";
import { CountryCodeSchema } from "./country-code.schema";

export const CityIdSchema = z.uuid();
export type CityId = z.infer<typeof CityIdSchema>;

export const CityListItemSchema = z.object({
    id: CityIdSchema,
    name: z.string().min(1).max(200),
    countryCode: CountryCodeSchema,
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    population: z.number().int().min(0),
});
export type CityListItem = z.infer<typeof CityListItemSchema>;

export const CityListItemListSchema = z.array(CityListItemSchema);

export const SearchCitiesQuerySchema = z.object({
    q: z.string().trim().min(1).max(100),
    country: CountryCodeSchema.optional(),
    limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type SearchCitiesQuery = z.infer<typeof SearchCitiesQuerySchema>;
