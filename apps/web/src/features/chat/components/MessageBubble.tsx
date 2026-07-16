export type MessageBubbleProps = {
    message: string;
    time: string;
    variant?: "incoming" | "outgoing";
};

export function MessageBubble({
    message,
    time,
    variant = "incoming",
}: MessageBubbleProps) {
    const isOutgoing = variant === "outgoing";

    return (
        <div
            className={`flex w-full ${isOutgoing ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`max-w-message px-3.5 py-3 rounded-[18px] flex flex-col gap-2 box-border ${
                    isOutgoing
                        ? "bg-primary text-secondary rounded-tr-[6px]"
                        : "bg-card border border-border text-text-primary rounded-tl-[6px]"
                }`}
            >
                <p className="m-0 text-sm leading-[22px] break-words">
                    {message}
                </p>
                <span className="text-xs leading-4 opacity-75 self-end">
                    {time}
                </span>
            </div>
        </div>
    );
}
