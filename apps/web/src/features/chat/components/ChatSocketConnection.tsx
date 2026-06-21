import { useChatSocket } from "../../../hooks/shared/useChatSocket";

// Holds the single app-wide chat WebSocket. Rendered once from the root route so
// the connection survives navigation between pages (mounting it per-page would
// tear down and reopen the socket on every route change). Renders nothing.
export function ChatSocketConnection() {
    useChatSocket();
    return null;
}
