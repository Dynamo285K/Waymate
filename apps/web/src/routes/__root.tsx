import { Suspense } from "react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { LayoutProvider } from "../lib/layout-context";
import type { RouterContext } from "../lib/route-guards";

export const Route = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <LayoutProvider>
            {/* Suspense boundary for the auto-code-split route chunks below. */}
            <Suspense
                fallback={<div className="min-h-screen bg-(--color-bg)" />}
            >
                <Outlet />
            </Suspense>
        </LayoutProvider>
    ),
});
