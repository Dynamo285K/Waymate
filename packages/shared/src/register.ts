import { z } from "zod";

import * as adminSchemas from "./admin.schema";
import * as bookingSchemas from "./booking.schema";
import * as carSchemas from "./car.schema";
import * as citySchemas from "./city.schema";
import * as cityInputSchemas from "./city-input.schema";
import * as countryCodeSchemas from "./country-code.schema";
import * as currencySchemas from "./currency.schema";
import * as decimalSchemas from "./decimal.schema";
import * as errorSchemas from "./error-response.schema";
import * as healthSchemas from "./health.schema";
import * as reportSchemas from "./report.schema";
import * as reviewSchemas from "./review.schema";
import * as rideSchemas from "./ride.schema";
import * as userSchemas from "./user.schema";

const allModules = [
    adminSchemas,
    bookingSchemas,
    carSchemas,
    citySchemas,
    cityInputSchemas,
    countryCodeSchemas,
    currencySchemas,
    decimalSchemas,
    errorSchemas,
    healthSchemas,
    reportSchemas,
    reviewSchemas,
    rideSchemas,
    userSchemas,
];

for (const mod of allModules) {
    for (const [name, value] of Object.entries(mod)) {
        if (!name.endsWith("Schema")) continue;
        if (!value || typeof value !== "object" || !("_zod" in value)) continue;
        z.globalRegistry.add(value as z.ZodType, {
            id: name.replace(/Schema$/, ""),
        });
    }
}
