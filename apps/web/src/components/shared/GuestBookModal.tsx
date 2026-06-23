import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Button, LockIcon, Modal } from "@waymate/ui";

interface GuestBookModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Shown when a guest (unauthenticated visitor) tries to book a ride: explains
 * sign-in is required and routes them to login or registration.
 */
export function GuestBookModal({ open, onClose }: GuestBookModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <div className="w-modal-viewport max-w-sm p-8 text-center flex flex-col gap-4">
                <div className="inline-flex justify-center text-primary">
                    <LockIcon />
                </div>
                <h2 className="text-xl font-bold text-text-primary">
                    {t("bookGuest.title")}
                </h2>
                <p className="text-text-secondary text-sm">
                    {t("bookGuest.message")}
                </p>
                <div className="flex gap-3 mt-2">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                            onClose();
                            navigate({ to: "/login" });
                        }}
                    >
                        {t("bookGuest.login")}
                    </Button>
                    <Button
                        fullWidth
                        onClick={() => {
                            onClose();
                            navigate({ to: "/register" });
                        }}
                    >
                        {t("bookGuest.register")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
