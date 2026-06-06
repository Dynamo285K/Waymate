import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    FieldLabel,
    FormSectionCard,
    CircleIcon,
    MapPinIcon,
} from "@waymate/ui";
import { LocationAutocomplete } from "../LocationAutocomplete";
import type { LocationSuggestion } from "../../lib/geocoding/photon";
import type { OfferRideFormInput } from "./schema";

// Pickup + dropoff. Both are RHF fields read/written through form context, so
// the parent no longer drills value/onChange/error props for them.
export function RouteSection() {
    const { t } = useTranslation();
    const { watch, setValue, formState } = useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    const [pickupBaseCity, setPickupBaseCity] = useState<LocationSuggestion | null>(null);
    const [dropoffBaseCity, setDropoffBaseCity] = useState<LocationSuggestion | null>(null);

    const pickupCityValue = watch("pickupCity");
    const dropoffCityValue = watch("dropoffCity");

    return (
        <FormSectionCard title={t("offerRide.route")}>
            <div
                className="offer-ride-form__field flex flex-col gap-4"
                data-testid="offer-pickup"
            >
                <FieldLabel
                    label={t("offerRide.pickup")}
                    icon={<CircleIcon />}
                />
                
                {/* 1. Výber mesta */}
                <LocationAutocomplete
                    value={pickupBaseCity}
                    onChange={(city) => {
                        setPickupBaseCity(city);
                        setValue("pickupCity", city, { shouldValidate: isSubmitted });
                    }}
                    placeholder={t("offerRide.pickupPlaceholder")}
                    searchType="city"
                />

                {/* 2. Výber presnej adresy (zobrazí sa až po výbere mesta) */}
                {pickupBaseCity && (
                    <LocationAutocomplete
                        value={pickupCityValue?.id !== pickupBaseCity.id ? pickupCityValue ?? null : null}
                        onChange={(address) => {
                            setValue("pickupCity", address ?? pickupBaseCity, { shouldValidate: isSubmitted });
                        }}
                        placeholder="Presná adresa (voliteľné)"
                        searchType="address"
                        parentCity={pickupBaseCity}
                    />
                )}

                {errors.pickupCity?.message && (
                    <p className="offer-ride-form__field-error">
                        {t(errors.pickupCity.message)}
                    </p>
                )}
            </div>

            <div
                className="offer-ride-form__field flex flex-col gap-4 mt-6"
                data-testid="offer-dropoff"
            >
                <FieldLabel
                    label={t("offerRide.dropoff")}
                    icon={<MapPinIcon />}
                />

                {/* 1. Výber mesta */}
                <LocationAutocomplete
                    value={dropoffBaseCity}
                    onChange={(city) => {
                        setDropoffBaseCity(city);
                        setValue("dropoffCity", city, { shouldValidate: isSubmitted });
                    }}
                    placeholder={t("offerRide.dropoffPlaceholder")}
                    searchType="city"
                />

                {/* 2. Výber presnej adresy */}
                {dropoffBaseCity && (
                    <LocationAutocomplete
                        value={dropoffCityValue?.id !== dropoffBaseCity.id ? dropoffCityValue ?? null : null}
                        onChange={(address) => {
                            setValue("dropoffCity", address ?? dropoffBaseCity, { shouldValidate: isSubmitted });
                        }}
                        placeholder="Presná adresa (voliteľné)"
                        searchType="address"
                        parentCity={dropoffBaseCity}
                    />
                )}

                {errors.dropoffCity?.message && (
                    <p className="offer-ride-form__field-error">
                        {t(errors.dropoffCity.message)}
                    </p>
                )}
            </div>
        </FormSectionCard>
    );
}
