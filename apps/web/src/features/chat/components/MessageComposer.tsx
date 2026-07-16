import { useState } from "react";
import { SendIcon } from "@/components/ui/icons/SendIcon";

export type MessageComposerProps = {
    placeholder?: string;
    onSend?: (message: string) => void;
};

export function MessageComposer({
    placeholder = "Write a message",
    onSend,
}: MessageComposerProps) {
    const [message, setMessage] = useState("");

    function handleSend() {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;
        onSend?.(trimmedMessage);
        setMessage("");
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            handleSend();
        }
    }

    return (
        <div className="w-full py-3 px-6 flex items-center gap-3 bg-card border-t border-border box-border">
            <input
                type="text"
                className="flex-1 h-12 border border-border rounded-full px-4.5 bg-input text-text-primary text-sm outline-none box-border placeholder:text-text-secondary focus:border-primary focus:shadow-focus"
                placeholder={placeholder}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
            />

            <button
                type="button"
                className="w-12 h-12 border-0 rounded-full bg-primary text-secondary inline-flex items-center justify-center cursor-pointer transition-[background,transform] duration-200 hover:bg-primary-hover active:scale-[0.96] [&_svg]:w-4.5 [&_svg]:h-4.5"
                onClick={handleSend}
                aria-label="Send message"
            >
                <SendIcon />
            </button>
        </div>
    );
}
