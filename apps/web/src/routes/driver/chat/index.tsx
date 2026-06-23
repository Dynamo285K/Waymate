import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "../../../features/chat/components/ChatPanel";
import { useBreakpoint } from "../../../hooks/shared/useBreakpoint";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/driver/chat/")({
    validateSearch: z.object({ conversation: z.string().optional() }),
    component: DriverChatPage,
});

function DriverChatPage() {
    const { conversation } = Route.useSearch();
    const { theme } = useLayout();
    const breakpoint = useBreakpoint(1024);
    const heightClass =
        breakpoint === "desktop"
            ? "h-chat-panel"
            : breakpoint === "tablet"
              ? "h-chat-panel-tablet"
              : "h-chat-panel-mobile";

    return (
        <div
            data-theme={theme}
            className={`${heightClass} bg-background flex flex-col overflow-hidden`}
        >
            <ChatPanel initialConversationId={conversation} />
        </div>
    );
}
