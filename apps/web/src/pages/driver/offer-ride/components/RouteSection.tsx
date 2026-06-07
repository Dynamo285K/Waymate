import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    FieldLabel,
    FormSectionCard,
    CircleIcon,
    MapPinIcon,
} from "@waymate/ui";
<<<<<<< HEAD:apps/web/src/components/offer-ride/RouteSection.tsx
import { LocationAutocomplete } from "../LocationAutocomplete";
=======
import { LocationAutocomplete } from "../../../../components/shared/LocationAutocomplete";
>>>>>>> 9c783bd3a0891412d3473c404a72c112c03dda0d:apps/web/src/pages/driver/offer-ride/components/RouteSection.tsx
import type { OfferRideFormInput } from "./schema";

export function RouteSection() {
    const { t } = useTranslation();
    const { watch, setValue, formState } = useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    const pickupCityValue = watch("pickupCity");
    const dropoffCityValue = watch("dropoffCity");

    return (
        <FormSectionCard title={t("offerRide.route")}>
            <div
<<<<<<< HEAD:apps/web/src/components/offer-ride/RouteSection.tsx
                className="offer-ride-form__field flex flex-col gap-4"
=======
                className="flex flex-col gap-2.5"
>>>>>>> 9c783bd3a0891412d3473c404a72c112c03dda0d:apps/web/src/pages/driver/offer-ride/components/RouteSection.tsx
                data-testid="offer-pickup"
            >
                <FieldLabel
                    label={t("offerRide.pickup")}
                    icon={<CircleIcon />}
                />
<<<<<<< HEAD:apps/web/src/components/offer-ride/RouteSection.tsx
                
                <LocationAutocomplete
                    value={pickupCityValue ?? null}
                    onChange={(location) => {
                        setValue("pickupCity", location, { shouldValidate: isSubmitted });
=======

                <LocationAutocomplete
                    value={pickupCityValue ?? null}
                    onChange={(location) => {
                        setValue("pickupCity", location, {
                            shouldValidate: isSubmitted,
                        });
>>>>>>> 9c783bd3a0891412d3473c404a72c112c03dda0d:apps/web/src/pages/driver/offer-ride/components/RouteSection.tsx
                    }}
                    placeholder={t("offerRide.pickupPlaceholder")}
                />

                {errors.pickupCity?.message && (
                    <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                        {t(errors.pickupCity.message)}
                    </p>
                )}
            </div>

            <div
<<<<<<< HEAD:apps/web/src/components/offer-ride/RouteSection.tsx
                className="offer-ride-form__field flex flex-col gap-4 mt-6"
=======
                className="flex flex-col gap-2.5"
>>>>>>> 9c783bd3a0891412d3473c404a72c112c03dda0d:apps/web/src/pages/driver/offer-ride/components/RouteSection.tsx
                data-testid="offer-dropoff"
            >
                <FieldLabel
                    label={t("offerRide.dropoff")}
                    icon={<MapPinIcon />}
                />

                <LocationAutocomplete
                    value={dropoffCityValue ?? null}
                    onChange={(location) => {
<<<<<<< HEAD:apps/web/src/components/offer-ride/RouteSection.tsx
                        setValue("dropoffCity", location, { shouldValidate: isSubmitted });
=======
                        setValue("dropoffCity", location, {
                            shouldValidate: isSubmitted,
                        });
>>>>>>> 9c783bd3a0891412d3473c404a72c112c03dda0d:apps/web/src/pages/driver/offer-ride/components/RouteSection.tsx
                    }}
                    placeholder={t("offerRide.dropoffPlaceholder")}
                />

                {errors.dropoffCity?.message && (
                    <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                        {t(errors.dropoffCity.message)}
                    </p>
                )}
            </div>
        </FormSectionCard>
    );
}
