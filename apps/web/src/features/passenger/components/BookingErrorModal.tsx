import { useTranslation } from "react-i18next";
import { Button, Modal } from "@waymate/ui";
import { useLayout } from "../../../lib/use-layout";
import { getErrorI18nKey } from "../../../lib/api-errors";

type BookingErrorModalProps = {
    isError: boolean;
    error: unknown;
    onClose: () => void;
};

const BOOKING_ERROR_MAP: Record<string, string> = {
    BOOKING_ALREADY_EXISTS: "bookings.alreadyBooked",
    BOOKING_SELF_BOOKING_NOT_ALLOWED: "bookings.cannotBookOwnRide",
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
                <h2 className="text-base font-bold text-(--color-text-primary) mb-2">
                    {t("bookings.errorTitle")}
                </h2>
                <p className="text-sm text-(--color-text-secondary) mb-5">
                    {t(
                        getErrorI18nKey(
                            error,
                            BOOKING_ERROR_MAP,
                            "bookings.createError"
                        )
                    )}
                </p>
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
