import { z } from "zod";
import type { CityListItem } from "../../../../components/shared/CitySelect";
import {
    combineDateAndTime,
    parseDurationMinutes,
    parsePositiveInteger,
} from "../lib/offer-ride";

// Single source of truth for the offer-ride form shape. Lives next to the
// section components so each can type `useFormContext<OfferRideFormInput>()`
// without importing from the page. Error messages are i18n keys, resolved by
// the sections via `t(...)`.
export const offerRideSchema = z
    .object({
        pickupCity: z
            .custom<CityListItem | null>()
            .refine(
                (value): value is CityListItem => value !== null,
                "offerRide.requiredField"
            ),
        dropoffCity: z
            .custom<CityListItem | null>()
            .refine(
                (value): value is CityListItem => value !== null,
                "offerRide.requiredField"
            ),
        rideDate: z
            .date()
            .optional()
            .refine(
                (value): value is Date => value instanceof Date,
                "offerRide.requiredField"
            ),
        rideTime: z.string().min(1, "offerRide.requiredField"),
        seats: z.string().superRefine((value, ctx) => {
            if (value.trim() === "") {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.requiredField",
                });
            } else if (parsePositiveInteger(value) === null) {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.invalidSeatsError",
                });
            }
        }),
        price: z.string().superRefine((value, ctx) => {
            if (value.trim() === "") {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.requiredField",
                });
            } else if (parsePositiveInteger(value) === null) {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.invalidPriceError",
                });
            }
        }),
        // Duration is two free-text inputs (hours + minutes); the combined
        // total must be > 0 (cross-field refine below). Manual-car fields are
        // unconstrained here — they only apply in "manual" mode and are
        // validated imperatively on submit, where the active mode is known.
        durationHours: z.string(),
        durationMinutes: z.string(),
        manualBrand: z.string(),
        manualModel: z.string(),
        manualPlate: z.string(),
    })
    .refine(
        (values) => {
            // disablePastDates blocks past calendar days; this additionally
            // rejects a today + earlier-time combination the API would 400 on.
            if (!(values.rideDate instanceof Date) || !values.rideTime) {
                return true;
            }
            const departureAt = combineDateAndTime(
                values.rideDate,
                values.rideTime
            );
            return departureAt !== null && departureAt.getTime() > Date.now();
        },
        { message: "offerRide.pastDeparture", path: ["rideTime"] }
    )
    .refine(
        (values) =>
            parseDurationMinutes(values.durationHours, values.durationMinutes) >
            0,
        { message: "offerRide.requiredField", path: ["durationHours"] }
    );

export type OfferRideFormInput = z.input<typeof offerRideSchema>;
export type OfferRideFormValues = z.output<typeof offerRideSchema>;
