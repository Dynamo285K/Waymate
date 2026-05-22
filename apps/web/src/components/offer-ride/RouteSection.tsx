import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    FieldLabel,
    FormSectionCard,
    CircleIcon,
    MapPinIcon,
} from "@waymate/ui";
import { CitySelect } from "../CitySelect";
import type { OfferRideFormInput } from "./schema";

// Pickup + dropoff. Both are RHF fields read/written through form context, so
// the parent no longer drills value/onChange/error props for them.
export function RouteSection() {
    const { t } = useTranslation();
    const { watch, setValue, formState } = useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    return (
        <FormSectionCard title={t("offerRide.route")}>
            <div
                className="offer-ride-form__field"
                data-testid="offer-pickup"
            >
                <FieldLabel
                    label={t("offerRide.pickup")}
                    icon={<CircleIcon />}
                />
                <CitySelect
                    value={watch("pickupCity") ?? null}
                    onChange={(city) =>
                        setValue("pickupCity", city, {
                            shouldValidate: isSubmitted,
                        })
                    }
                    placeholder={t("offerRide.pickupPlaceholder")}
                />
                {errors.pickupCity?.message && (
                    <p className="offer-ride-form__field-error">
                        {t(errors.pickupCity.message)}
                    </p>
                )}
            </div>
            <div
                className="offer-ride-form__field"
                data-testid="offer-dropoff"
            >
                <FieldLabel
                    label={t("offerRide.dropoff")}
                    icon={<MapPinIcon />}
                />
                <CitySelect
                    value={watch("dropoffCity") ?? null}
                    onChange={(city) =>
                        setValue("dropoffCity", city, {
                            shouldValidate: isSubmitted,
                        })
                    }
                    placeholder={t("offerRide.dropoffPlaceholder")}
                />
                {errors.dropoffCity?.message && (
                    <p className="offer-ride-form__field-error">
                        {t(errors.dropoffCity.message)}
                    </p>
                )}
            </div>
        </FormSectionCard>
    );
}
