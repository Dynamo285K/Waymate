import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { PassengerNavbar } from "../../components/navigation/PassengerNavbar";
import { usePassengerNavbarProps } from "../../hooks/shared/usePassengerNavbarProps";
import { ChatPanel } from "../../features/chat/components/ChatPanel";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/passenger/chat")({
    validateSearch: z.object({ conversation: z.string().optional() }),
    beforeLoad: requireAudience(["user"]),
    component: PassengerChatPage,
});

export function PassengerChatPage() {
    const { conversation } = Route.useSearch();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = usePassengerNavbarProps({
        activeTab: "chat",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg) flex flex-col"
        >
            <PassengerNavbar {...navbarProps} />
            <ChatPanel initialConversationId={conversation} />
        </div>
    );
}
