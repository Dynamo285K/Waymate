import { createRouter } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { routeTree } from "./routeTree.gen";
import { RouteErrorBoundary } from "./components/shared/RouteErrorBoundary";
import { FullPageSpinner } from "./components/shared/FullPageSpinner";

NProgress.configure({ showSpinner: false });

export function createAppRouter(queryClient: QueryClient) {
    const router = createRouter({
        routeTree,
        context: { queryClient },
        defaultErrorComponent: RouteErrorBoundary,
        defaultPendingComponent: FullPageSpinner,
        defaultPendingMs: 0,
    });

    router.subscribe("onBeforeLoad", ({ pathChanged }) => {
        if (pathChanged) {
            NProgress.start();
        }
    });

    router.subscribe("onLoad", () => {
        NProgress.done();
    });

    return router;
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
    interface Register {
        router: AppRouter;
    }
}
