import * as Select from "@radix-ui/react-select";
import type { Locale } from "date-fns";
import {
    Button,
    DatePicker,
    FieldLabel,
    FormSectionCard,
    Input,
    SegmentedControl,
    CalendarIcon,
    CarIcon,
    ChevronDownIcon,
    CircleIcon,
    ClockIcon,
    CoinsIcon,
    MapPinIcon,
    UserIcon,
} from "@waymate/ui";
import "./OfferRideForm.css";

export type OfferRideCar = {
    id: string;
    brand: string;
    model: string;
    plate: string;
};

export type OfferRideFormLabels = {
    title?: string;
    subtitle?: string;
    routeSection?: string;
    pickup?: string;
    pickupPlaceholder?: string;
    dropoff?: string;
    dropoffPlaceholder?: string;
    dateTimeSection?: string;
    date?: string;
    time?: string;
    seatsPriceSection?: string;
    availableSeats?: string;
    seatsPlaceholder?: string;
    pricePerSeat?: string;
    pricePlaceholder?: string;
    carSection?: string;
    myCars?: string;
    manualCar?: string;
    chooseCar?: string;
    carBrand?: string;
    carBrandPlaceholder?: string;
    carModel?: string;
    carModelPlaceholder?: string;
    selectCarBrand?: string;
    selectCarModel?: string;
    loadingCarBrands?: string;
    loadingCarModels?: string;
    licensePlate?: string;
    platePlaceholder?: string;
    plateError?: string;
    noCars?: string;
    publishLabel?: string;
};

export type OfferRideFormProps = {
    labels?: OfferRideFormLabels;
    pickup?: string;
    onPickupChange?: (value: string) => void;
    dropoff?: string;
    onDropoffChange?: (value: string) => void;
    date?: Date;
    onDateChange?: (date: Date | undefined) => void;
    dateLocale?: Locale;
    today?: Date;
    time?: string;
    onTimeChange?: (time: string) => void;
    timeOptions?: string[];
    seats?: string;
    onSeatsChange?: (value: string) => void;
    price?: string;
    onPriceChange?: (value: string) => void;
    savedCars?: OfferRideCar[];
    carMode?: "saved" | "manual";
    onCarModeChange?: (mode: "saved" | "manual") => void;
    selectedCarId?: string;
    onSelectedCarChange?: (id: string) => void;
    manualBrand?: string;
    onManualBrandChange?: (value: string) => void;
    manualBrandOptions?: string[];
    manualBrandLoading?: boolean;
    manualModel?: string;
    onManualModelChange?: (value: string) => void;
    manualModelOptions?: string[];
    manualModelLoading?: boolean;
    manualModelDisabled?: boolean;
    manualPlate?: string;
    onManualPlateChange?: (value: string) => void;
    manualPlateError?: string;
    publishedMessage?: string;
    onPublishClick?: () => void;
};

const DEFAULT_TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
});

export function OfferRideForm({
    labels,
    pickup = "",
    onPickupChange,
    dropoff = "",
    onDropoffChange,
    date,
    onDateChange,
    dateLocale,
    today,
    time = "",
    onTimeChange,
    timeOptions = DEFAULT_TIME_OPTIONS,
    seats = "",
    onSeatsChange,
    price = "",
    onPriceChange,
    savedCars = [],
    carMode = "saved",
    onCarModeChange,
    selectedCarId = "",
    onSelectedCarChange,
    manualBrand = "",
    onManualBrandChange,
    manualBrandOptions,
    manualBrandLoading = false,
    manualModel = "",
    onManualModelChange,
    manualModelOptions,
    manualModelLoading = false,
    manualModelDisabled = false,
    manualPlate = "",
    onManualPlateChange,
    manualPlateError,
    publishedMessage,
    onPublishClick,
}: OfferRideFormProps) {
    const selectedCar = savedCars.find((c) => c.id === selectedCarId);
    const hasSavedCars = savedCars.length > 0;
    const useBrandSelect = Boolean(manualBrandOptions);
    const useModelSelect = Boolean(manualModelOptions);

    const carModeOptions = [
        { label: labels?.myCars ?? "My cars", value: "saved" },
        { label: labels?.manualCar ?? "Manual entry", value: "manual" },
    ];

    return (
        <div className="offer-ride-form">
            <div className="offer-ride-form__header">
                <h1 className="offer-ride-form__title">
                    {labels?.title ?? "Offer a ride"}
                </h1>
                <p className="offer-ride-form__subtitle">
                    {labels?.subtitle ?? "Share your journey and earn money"}
                </p>
            </div>

            <div className="offer-ride-form__sections">
                <FormSectionCard title={labels?.routeSection ?? "Route"}>
                    <div className="offer-ride-form__field">
                        <FieldLabel
                            label={labels?.pickup ?? "Pickup location"}
                            icon={<CircleIcon />}
                        />
                        <Input
                            value={pickup}
                            onChange={(e) => onPickupChange?.(e.target.value)}
                            placeholder={
                                labels?.pickupPlaceholder ??
                                "Enter pickup location"
                            }
                        />
                    </div>
                    <div className="offer-ride-form__field">
                        <FieldLabel
                            label={labels?.dropoff ?? "Dropoff location"}
                            icon={<MapPinIcon />}
                        />
                        <Input
                            value={dropoff}
                            onChange={(e) => onDropoffChange?.(e.target.value)}
                            placeholder={
                                labels?.dropoffPlaceholder ??
                                "Enter destination"
                            }
                        />
                    </div>
                </FormSectionCard>

                <FormSectionCard
                    title={labels?.dateTimeSection ?? "Date & Time"}
                >
                    <div className="offer-ride-form__grid offer-ride-form__grid--two-columns">
                        <div className="offer-ride-form__field">
                            <FieldLabel
                                label={labels?.date ?? "Date"}
                                icon={<CalendarIcon />}
                            />
                            <DatePicker
                                value={date}
                                onChange={onDateChange}
                                locale={dateLocale}
                                today={today}
                                disablePastDates
                            />
                        </div>
                        <div className="offer-ride-form__field">
                            <FieldLabel
                                label={labels?.time ?? "Time"}
                                icon={<ClockIcon />}
                            />
                            <Select.Root
                                value={time || undefined}
                                onValueChange={onTimeChange}
                            >
                                <Select.Trigger
                                    className={`offer-ride-form__time-trigger${!time ? " offer-ride-form__time-trigger--placeholder" : ""}`}
                                >
                                    <Select.Value placeholder="--:--" />
                                    <Select.Icon className="offer-ride-form__select-icon">
                                        <ClockIcon />
                                    </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content
                                        className="offer-ride-form__time-dropdown"
                                        position="popper"
                                        sideOffset={8}
                                    >
                                        <Select.Viewport>
                                            {timeOptions.map((t) => (
                                                <Select.Item
                                                    key={t}
                                                    value={t}
                                                    className={`offer-ride-form__time-option${time === t ? " offer-ride-form__time-option--active" : ""}`}
                                                >
                                                    <Select.ItemText>
                                                        {t}
                                                    </Select.ItemText>
                                                </Select.Item>
                                            ))}
                                        </Select.Viewport>
                                    </Select.Content>
                                </Select.Portal>
                            </Select.Root>
                        </div>
                    </div>
                </FormSectionCard>

                <FormSectionCard
                    title={
                        labels?.seatsPriceSection ??
                        "Available seats & Price per seat"
                    }
                >
                    <div className="offer-ride-form__grid offer-ride-form__grid--two-columns">
                        <div className="offer-ride-form__field">
                            <FieldLabel
                                label={
                                    labels?.availableSeats ?? "Available seats"
                                }
                                icon={<UserIcon />}
                            />
                            <Input
                                type="number"
                                value={seats}
                                onChange={(e) =>
                                    onSeatsChange?.(e.target.value)
                                }
                                placeholder={
                                    labels?.seatsPlaceholder ?? "e.g., 3"
                                }
                            />
                        </div>
                        <div className="offer-ride-form__field">
                            <FieldLabel
                                label={labels?.pricePerSeat ?? "Price per seat"}
                                icon={<CoinsIcon />}
                            />
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) =>
                                    onPriceChange?.(e.target.value)
                                }
                                placeholder={
                                    labels?.pricePlaceholder ?? "e.g., 12"
                                }
                            />
                        </div>
                    </div>
                </FormSectionCard>

                <FormSectionCard
                    title={labels?.carSection ?? "Car details"}
                    headerRight={
                        hasSavedCars ? (
                            <SegmentedControl
                                options={carModeOptions}
                                value={carMode}
                                onChange={(v) =>
                                    onCarModeChange?.(v as "saved" | "manual")
                                }
                            />
                        ) : undefined
                    }
                >
                    {hasSavedCars && carMode === "saved" ? (
                        <div className="offer-ride-form__car-saved">
                            <div className="offer-ride-form__field">
                                <FieldLabel
                                    label={labels?.chooseCar ?? "Choose car"}
                                    icon={<CarIcon />}
                                />
                                <Select.Root
                                    value={selectedCarId || undefined}
                                    onValueChange={onSelectedCarChange}
                                >
                                    <Select.Trigger className="offer-ride-form__select-trigger">
                                        <Select.Value
                                            placeholder={
                                                labels?.chooseCar ??
                                                "Choose car"
                                            }
                                        />
                                        <Select.Icon className="offer-ride-form__select-icon">
                                            <ChevronDownIcon />
                                        </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Content
                                            className="offer-ride-form__select-content"
                                            position="popper"
                                            sideOffset={8}
                                        >
                                            <Select.Viewport>
                                                {savedCars.map((car) => (
                                                    <Select.Item
                                                        key={car.id}
                                                        value={car.id}
                                                        className="offer-ride-form__select-item"
                                                    >
                                                        <Select.ItemText>
                                                            {car.brand}{" "}
                                                            {car.model} –{" "}
                                                            {car.plate}
                                                        </Select.ItemText>
                                                    </Select.Item>
                                                ))}
                                            </Select.Viewport>
                                        </Select.Content>
                                    </Select.Portal>
                                </Select.Root>
                            </div>
                            <div className="offer-ride-form__grid offer-ride-form__grid--two-columns">
                                <div className="offer-ride-form__car-info">
                                    <p className="offer-ride-form__car-info-label">
                                        {labels?.carBrand ?? "Brand"}
                                    </p>
                                    <p className="offer-ride-form__car-info-value">
                                        {selectedCar?.brand ?? "—"}
                                    </p>
                                </div>
                                <div className="offer-ride-form__car-info">
                                    <p className="offer-ride-form__car-info-label">
                                        {labels?.carModel ?? "Model"}
                                    </p>
                                    <p className="offer-ride-form__car-info-value">
                                        {selectedCar?.model ?? "—"}
                                    </p>
                                </div>
                                <div className="offer-ride-form__car-info offer-ride-form__car-info--full">
                                    <p className="offer-ride-form__car-info-label">
                                        {labels?.licensePlate ??
                                            "License plate"}
                                    </p>
                                    <p className="offer-ride-form__car-info-value">
                                        {selectedCar?.plate ?? "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="offer-ride-form__car-manual">
                            {!hasSavedCars && (
                                <p className="offer-ride-form__no-cars">
                                    {labels?.noCars ??
                                        "You have no saved cars. Enter car details manually."}
                                </p>
                            )}
                            <div className="offer-ride-form__grid offer-ride-form__grid--two-columns">
                                <div className="offer-ride-form__field">
                                    <FieldLabel
                                        label={labels?.carBrand ?? "Brand"}
                                        icon={<CarIcon />}
                                    />
                                    {useBrandSelect ? (
                                        <Select.Root
                                            value={manualBrand || undefined}
                                            onValueChange={onManualBrandChange}
                                            disabled={manualBrandLoading}
                                        >
                                            <Select.Trigger className="offer-ride-form__select-trigger">
                                                <Select.Value
                                                    placeholder={
                                                        manualBrandLoading
                                                            ? (labels?.loadingCarBrands ??
                                                              "Loading brands...")
                                                            : (labels?.selectCarBrand ??
                                                              labels?.carBrandPlaceholder ??
                                                              "Select brand")
                                                    }
                                                />
                                                <Select.Icon className="offer-ride-form__select-icon">
                                                    <ChevronDownIcon />
                                                </Select.Icon>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Content
                                                    className="offer-ride-form__select-content"
                                                    position="popper"
                                                    sideOffset={8}
                                                >
                                                    <Select.Viewport className="offer-ride-form__select-viewport">
                                                        {manualBrandOptions?.map(
                                                            (brand) => (
                                                                <Select.Item
                                                                    key={brand}
                                                                    value={
                                                                        brand
                                                                    }
                                                                    className="offer-ride-form__select-item"
                                                                >
                                                                    <Select.ItemText>
                                                                        {brand}
                                                                    </Select.ItemText>
                                                                </Select.Item>
                                                            )
                                                        )}
                                                    </Select.Viewport>
                                                </Select.Content>
                                            </Select.Portal>
                                        </Select.Root>
                                    ) : (
                                        <Input
                                            value={manualBrand}
                                            onChange={(e) =>
                                                onManualBrandChange?.(
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                labels?.carBrandPlaceholder ??
                                                "e.g., Škoda"
                                            }
                                        />
                                    )}
                                </div>
                                <div className="offer-ride-form__field">
                                    <FieldLabel
                                        label={labels?.carModel ?? "Model"}
                                    />
                                    {useModelSelect ? (
                                        <Select.Root
                                            value={manualModel || undefined}
                                            onValueChange={onManualModelChange}
                                            disabled={
                                                manualModelLoading ||
                                                manualModelDisabled
                                            }
                                        >
                                            <Select.Trigger className="offer-ride-form__select-trigger">
                                                <Select.Value
                                                    placeholder={
                                                        manualModelLoading
                                                            ? (labels?.loadingCarModels ??
                                                              "Loading models...")
                                                            : (labels?.selectCarModel ??
                                                              labels?.carModelPlaceholder ??
                                                              "Select model")
                                                    }
                                                />
                                                <Select.Icon className="offer-ride-form__select-icon">
                                                    <ChevronDownIcon />
                                                </Select.Icon>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Content
                                                    className="offer-ride-form__select-content"
                                                    position="popper"
                                                    sideOffset={8}
                                                >
                                                    <Select.Viewport className="offer-ride-form__select-viewport">
                                                        {manualModelOptions?.map(
                                                            (model) => (
                                                                <Select.Item
                                                                    key={model}
                                                                    value={
                                                                        model
                                                                    }
                                                                    className="offer-ride-form__select-item"
                                                                >
                                                                    <Select.ItemText>
                                                                        {model}
                                                                    </Select.ItemText>
                                                                </Select.Item>
                                                            )
                                                        )}
                                                    </Select.Viewport>
                                                </Select.Content>
                                            </Select.Portal>
                                        </Select.Root>
                                    ) : (
                                        <Input
                                            value={manualModel}
                                            onChange={(e) =>
                                                onManualModelChange?.(
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                labels?.carModelPlaceholder ??
                                                "e.g., Fabia"
                                            }
                                        />
                                    )}
                                </div>
                                <div className="offer-ride-form__field offer-ride-form__field--full">
                                    <FieldLabel
                                        label={
                                            labels?.licensePlate ??
                                            "License plate"
                                        }
                                    />
                                    <Input
                                        value={manualPlate}
                                        onChange={(e) =>
                                            onManualPlateChange?.(
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder={
                                            labels?.platePlaceholder ??
                                            "e.g., BA-123AB"
                                        }
                                    />
                                    {(manualPlateError ||
                                        labels?.plateError) && (
                                        <p className="offer-ride-form__field-error">
                                            {manualPlateError ??
                                                labels?.plateError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </FormSectionCard>
            </div>

            {publishedMessage && (
                <p className="offer-ride-form__published">{publishedMessage}</p>
            )}

            <div className="offer-ride-form__actions">
                <Button
                    fullWidth
                    onClick={onPublishClick}
                >
                    {labels?.publishLabel ?? "Publish ride"}
                </Button>
            </div>
        </div>
    );
}
