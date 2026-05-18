import { Elysia } from "elysia";
import { CityService } from "./city.service";
import {
    ErrorResponseSchema,
    CityListItemSchema,
    CityListItemListSchema,
    SearchCitiesQuerySchema,
} from "@repo/shared";

export const CityRoutes = new Elysia({ prefix: "/cities", tags: ["Cities"] })
    .model({
        CityListItem: CityListItemSchema,
        CityListItemList: CityListItemListSchema,
        SearchCitiesQuery: SearchCitiesQuerySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .get("/", async ({ query }) => await CityService.searchCities(query), {
        query: SearchCitiesQuerySchema,
        response: {
            200: "CityListItemList",
            400: "ErrorResponse",
            429: "ErrorResponse",
            500: "ErrorResponse",
        },
        detail: {
            description:
                "Returns cities matching the query prefix, ranked by population. Used by the ride creation and search forms to restrict stop selection to known cities.",
        },
    });
