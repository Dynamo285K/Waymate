import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    FieldLabel,
    FormSectionCard,
    Input,
    CoinsIcon,
    UserIcon,
} from "@waymate/ui";
import { isIntegerInput } from "../../lib/offer-ride";
import type { OfferRideFormInput } from "./schema";

// Available seats + price per seat. Both are digit-only RHF string fields.
export function SeatsPriceSection() {
    const { t } = useTranslation();
    const { watch, setValue, formState } = useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    // Mirror the previous guard: ignore keystrokes that aren't all digits.
    const setDigits = (field: "seats" | "price", value: string) => {
        if (isIntegerInput(value)) {
            setValue(field, value, { shouldValidate: isSubmitted });
        }
    };

    return (
        <FormSectionCard title={t("offerRide.seatsPrice")}>
            <div className="offer-ride-form__grid offer-ride-form__grid--two-columns">
                <div
                    className="offer-ride-form__field"
                    data-testid="offer-seats"
                >
                    <FieldLabel
                        label={t("offerRide.availableSeats")}
                        icon={<UserIcon />}
                    />
                    <Input
                        type="number"
                        value={watch("seats")}
                        onChange={(e) => setDigits("seats", e.target.value)}
                        placeholder={t("offerRide.seatsPlaceholder")}
                    />
                    {errors.seats?.message && (
                        <p className="offer-ride-form__field-error">
                            {t(errors.seats.message)}
                        </p>
                    )}
                </div>
                <div
                    className="offer-ride-form__field"
                    data-testid="offer-price"
                >
                    <FieldLabel
                        label={t("offerRide.pricePerSeat")}
                        icon={<CoinsIcon />}
                    />
                    <Input
                        type="number"
                        value={watch("price")}
                        onChange={(e) => setDigits("price", e.target.value)}
                        placeholder={t("offerRide.pricePlaceholder")}
                    />
                    {errors.price?.message && (
                        <p className="offer-ride-form__field-error">
                            {t(errors.price.message)}
                        </p>
                    )}
                </div>
            </div>
        </FormSectionCard>
    );
}
