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

export function SeatsPriceSection() {
    const { t } = useTranslation();
    const { watch, setValue, formState } = useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    const setDigits = (field: "seats" | "price", value: string) => {
        if (isIntegerInput(value)) {
            setValue(field, value, { shouldValidate: isSubmitted });
        }
    };

    return (
        <FormSectionCard title={t("offerRide.seatsPrice")}>
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                <div
                    className="flex flex-col gap-2.5"
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
                        <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                            {t(errors.seats.message)}
                        </p>
                    )}
                </div>
                <div
                    className="flex flex-col gap-2.5"
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
                        <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                            {t(errors.price.message)}
                        </p>
                    )}
                </div>
            </div>
        </FormSectionCard>
    );
}
