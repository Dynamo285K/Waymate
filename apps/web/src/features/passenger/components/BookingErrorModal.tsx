import { useTranslation } from "react-i18next";
import { Button, Modal } from "@waymate/ui";
import { useLayout } from "../../../lib/use-layout";
import { getErrorCode, getErrorI18nKey } from "../../../lib/api-errors";

type BookingErrorModalProps = {
    isError: boolean;
    error: unknown;
    onClose: () => void;
};

const BOOKING_ERROR_MAP: Record<string, string> = {
    BOOKING_ALREADY_EXISTS: "bookings.alreadyBooked",
    BOOKING_SELF_BOOKING_NOT_ALLOWED: "bookings.cannotBookOwnRide",
    BOOKING_NOT_ENOUGH_SEATS: "bookings.notEnoughSeats",
    BOOKING_INVALID_STOPS: "bookings.invalidStops",
    BOOKING_PRICE_NOT_FOUND: "bookings.priceNotFound",
    BOOKING_RIDE_NOT_FOUND_OR_UNAVAILABLE: "bookings.rideUnavailable",
    BOOKING_BLOCKED: "bookings.blocked",
};

export function BookingErrorModal({
    isError,
    error,
    onClose,
}: BookingErrorModalProps) {
    const { t } = useTranslation();
    const { theme } = useLayout();

    return (
        <Modal
            open={isError}
            onClose={onClose}
            theme={theme}
        >
            <div className="p-6">
                <h2 className="text-base font-bold text-text-primary mb-2">
                    {t("bookings.errorTitle")}
                </h2>
                <p className="text-sm text-text-secondary mb-5">
                    {t(
                        getErrorI18nKey(
                            error,
                            BOOKING_ERROR_MAP,
                            "bookings.createError"
                        )
                    )}
                </p>
                {/* The stable API error code — so a failure is diagnosable
                    straight from the dialog even for codes without a mapped
                    message (matches the errorCode in the request log). */}
                {getErrorCode(error) && (
                    <p className="-mt-3 mb-5 font-mono text-xs text-text-secondary/70">
                        {getErrorCode(error)}
                    </p>
                )}
                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        onClick={onClose}
                    >
                        {t("admin.close")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
