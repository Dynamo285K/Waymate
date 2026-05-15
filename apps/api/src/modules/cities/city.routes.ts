import { Elysia } from "elysia";
import { CityService } from "./city.service";
import { isAuthenticated } from "../auth/auth.middleware";
import {
    ErrorResponseSchema,
    CityListItemSchema,
    CityListItemListSchema,
    SearchCitiesQuerySchema,
} from "@repo/shared";

// No `.onError` here — the only failures this endpoint can produce are
// AuthError (mapped by the global handler in src/index.ts) and Zod
// validation (mapped to 400 by the same global handler). Empty-after-
// normalization is handled gracefully in CityService by returning [].
export const CityRoutes = new Elysia({ prefix: "/cities", tags: ["Cities"] })
    .model({
        CityListItem: CityListItemSchema,
        CityListItemList: CityListItemListSchema,
        SearchCitiesQuery: SearchCitiesQuerySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .use(isAuthenticated)
    .guard({ auth: true }, (app) =>
        app.get(
            "/",
            async ({ query }) => await CityService.searchCities(query),
            {
                query: SearchCitiesQuerySchema,
                response: {
                    200: "CityListItemList",
                    400: "ErrorResponse",
                    401: "ErrorResponse",
                    429: "ErrorResponse",
                    500: "ErrorResponse",
                },
                detail: {
                    description:
                        "Returns cities matching the query prefix, ranked by population. Used by the ride creation and search forms to restrict stop selection to known cities.",
                },
            }
        )
    );
