import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    theme?: string;
}

export function Modal({ open, onClose, children, theme }: ModalProps) {
    return (
        <Dialog.Root
            open={open}
            onOpenChange={(isOpen) => !isOpen && onClose()}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-1000 bg-black/40 backdrop-blur-[2px]" />
                <Dialog.Content
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-max min-w-[min(20rem,calc(100vw-2rem))] max-w-modal-viewport py-7 px-8 bg-card rounded-3xl shadow-modal-strong outline-none"
                    aria-describedby={undefined}
                    data-theme={theme}
                >
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
