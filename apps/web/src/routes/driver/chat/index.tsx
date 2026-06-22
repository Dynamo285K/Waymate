import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "../../../features/chat/components/ChatPanel";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/driver/chat/")({
    validateSearch: z.object({ conversation: z.string().optional() }),
    component: DriverChatPage,
});

function DriverChatPage() {
    const { conversation } = Route.useSearch();
    const { theme } = useLayout();

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background flex flex-col"
        >
            <ChatPanel initialConversationId={conversation} />
        </div>
    );
}
