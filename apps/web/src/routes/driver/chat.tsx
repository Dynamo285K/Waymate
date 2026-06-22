import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { ChatPanel } from "../../features/chat/components/ChatPanel";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/driver/chat")({
    validateSearch: z.object({ conversation: z.string().optional() }),
    beforeLoad: requireAudience(["user"]),
    component: DriverChatPage,
});

export function DriverChatPage() {
    const { conversation } = Route.useSearch();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = useDriverNavbarProps({
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
            className="min-h-screen bg-background flex flex-col"
        >
            <DriverNavbar {...navbarProps} />
            <ChatPanel initialConversationId={conversation} />
        </div>
    );
}
