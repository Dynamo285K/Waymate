import { Suspense } from "react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { LayoutProvider } from "../lib/layout-context";
import { ChatSocketConnection } from "../features/chat/components/ChatSocketConnection";
import type { RouterContext } from "../lib/route-guards";

export const Route = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <LayoutProvider>
            {/* One chat socket for the whole session, stable across navigation. */}
            <ChatSocketConnection />
            {/* Suspense boundary for the auto-code-split route chunks below. */}
            <Suspense
                fallback={<div className="min-h-screen bg-(--color-bg)" />}
            >
                <Outlet />
            </Suspense>
        </LayoutProvider>
    ),
});
