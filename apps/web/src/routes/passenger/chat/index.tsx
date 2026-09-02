import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "../../../features/chat/components/ChatPanel";
import { useBreakpoint } from "../../../hooks/shared/useBreakpoint";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/passenger/chat/")({
    validateSearch: z.object({ conversation: z.string().optional() }),
    component: PassengerChatPage,
});

function PassengerChatPage() {
    const { conversation } = Route.useSearch();
    const { theme } = useLayout();
    return (
        <div
            data-theme={theme}
            className="flex-1 w-full bg-background flex flex-col overflow-hidden"
        >
            <ChatPanel initialConversationId={conversation} />
        </div>
    );
}
