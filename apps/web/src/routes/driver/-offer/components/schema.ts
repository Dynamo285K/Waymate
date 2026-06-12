import { z } from "zod";
import type { LocationSuggestion } from "../../../../components/shared/LocationAutocomplete";
import { combineDateAndTime, parsePositiveInteger } from "../lib/offer-ride";

// Single source of truth for the offer-ride form shape. Lives next to the
// section components so each can type `useFormContext<OfferRideFormInput>()`
// without importing from the page. Error messages are i18n keys, resolved by
// the sections via `t(...)`.
export const offerRideSchema = z
    .object({
        pickupCity: z
            .custom<LocationSuggestion | null>()
            .refine(
                (value): value is LocationSuggestion => value !== null,
                "offerRide.requiredField"
            ),
        dropoffCity: z
            .custom<LocationSuggestion | null>()
            .refine(
                (value): value is LocationSuggestion => value !== null,
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
        // Manual-car fields are unconstrained here — they only apply in
        // "manual" mode and are validated imperatively on submit, where the
        // active mode is known.
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
    );

export type OfferRideFormInput = z.input<typeof offerRideSchema>;
export type OfferRideFormValues = z.output<typeof offerRideSchema>;
