import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    FieldLabel,
    FormSectionCard,
    CircleIcon,
    MapPinIcon,
} from "@waymate/ui";
import { LocationAutocomplete } from "../../../../components/shared/LocationAutocomplete";
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
                className="flex flex-col gap-2.5"
                data-testid="offer-pickup"
            >
                <FieldLabel
                    label={t("offerRide.pickup")}
                    icon={<CircleIcon />}
                />

                <LocationAutocomplete
                    value={pickupCityValue ?? null}
                    onChange={(location) => {
                        setValue("pickupCity", location, {
                            shouldValidate: isSubmitted,
                        });
                    }}
                    placeholder={t("offerRide.pickupPlaceholder")}
                />

                {errors.pickupCity?.message && (
                    <p className="-mt-0.5 text-danger-text text-xs font-semibold">
                        {t(errors.pickupCity.message)}
                    </p>
                )}
            </div>

            <div
                className="flex flex-col gap-2.5"
                data-testid="offer-dropoff"
            >
                <FieldLabel
                    label={t("offerRide.dropoff")}
                    icon={<MapPinIcon />}
                />

                <LocationAutocomplete
                    value={dropoffCityValue ?? null}
                    onChange={(location) => {
                        setValue("dropoffCity", location, {
                            shouldValidate: isSubmitted,
                        });
                    }}
                    placeholder={t("offerRide.dropoffPlaceholder")}
                />

                {errors.dropoffCity?.message && (
                    <p className="-mt-0.5 text-danger-text text-xs font-semibold">
                        {t(errors.dropoffCity.message)}
                    </p>
                )}
            </div>
        </FormSectionCard>
    );
}
