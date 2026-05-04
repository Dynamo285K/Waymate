import {
    createRootRouteWithContext,
    createRoute,
    createRouter,
    Outlet,
    redirect,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { LayoutProvider } from "./lib/layout-context";
import type { useLayout } from "./lib/use-layout";
import { HomeRoute } from "./lib/route-components";
import { makeAudienceComponent } from "./lib/make-audience-component";
import { CURRENT_USER_QUERY_KEY, getCurrentUserOrNull } from "./lib/auth";
import type { UserRole } from "./api-client/model/userRole";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { RidesPage } from "./pages/RidesPage";
import { PassengerHomePage } from "./pages/PassengerHomePage";
import { PassengerChatPage } from "./pages/PassengerChatPage";
import { PassengerRidesPage } from "./pages/PassengerRidesPage";
import { PassengerMyRidesPage } from "./pages/PassengerMyRidesPage";
import { PassengerProfilePage } from "./pages/PassengerProfilePage";
import { PassengerRatingsPage } from "./pages/PassengerRatingsPage";
import { DriverHomePage } from "./pages/DriverHomePage";
import { DriverChatPage } from "./pages/DriverChatPage";
import { DriverMyRidesPage } from "./pages/DriverMyRidesPage";
import { DriverPassengersPage } from "./pages/DriverPassengersPage";
import { DriverRatePassengersPage } from "./pages/DriverRatePassengersPage";
import { DriverOfferRidePage } from "./pages/DriverOfferRidePage";
import { DriverRideRequestsPage } from "./pages/DriverRideRequestsPage";
import { DriverProfilePage } from "./pages/DriverProfilePage";
import { DriverRatingsPage } from "./pages/DriverRatingsPage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { AddCarPage } from "./pages/AddCarPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminRidesPage } from "./pages/AdminRidesPage";
import { AdminUsersPage } from "./pages/AdminUsers";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { AdminAccountPage } from "./pages/AdminAccountPage";

interface RouterContext {
    queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <LayoutProvider>
            <Outlet />
        </LayoutProvider>
    ),
});

// Resolve the current user with a fresh fetch every guard run. `fetchQuery`
// (not `ensureQueryData`) bypasses any stale cached data — e.g. a pre-login
// 401 — and the result is written under `CURRENT_USER_QUERY_KEY` so
// `LayoutProvider` reuses it without an extra round trip.
async function fetchUserRole(
    queryClient: QueryClient
): Promise<UserRole | null> {
    const user = await queryClient.fetchQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: getCurrentUserOrNull,
        staleTime: 0,
    });
    return user?.userRole ?? null;
}

// The app has exactly three audiences. Every route declares which of them may
// reach it; everyone else is bounced to their own home. Keeping the model
// closed (no implicit "authenticated, partly-onboarded" leak-through state)
// is the whole point — the role is `guest | user | admin`, nothing else.
type Audience = "guest" | "user" | "admin";

function audienceFromRole(role: UserRole | null): Audience {
    if (role === null) return "guest";
    if (role === "ADMIN") return "admin";
    return "user";
}

const HOME_BY_AUDIENCE: Record<Audience, string> = {
    guest: "/login",
    user: "/passenger",
    admin: "/admin",
};

const requireAudience =
    (allowed: ReadonlyArray<Audience>) =>
    async ({ context }: { context: RouterContext }): Promise<void> => {
        const role = await fetchUserRole(context.queryClient);
        const current = audienceFromRole(role);
        if (!allowed.includes(current)) {
            throw redirect({
                to: HOME_BY_AUDIENCE[current] as never,
                replace: true,
            });
        }
    };

type AudienceRoute = {
    path: string;
    Component: React.ComponentType<{
        language: ReturnType<typeof useLayout>["language"];
        theme: ReturnType<typeof useLayout>["theme"];
        onLanguageChange: ReturnType<typeof useLayout>["onLanguageChange"];
        onThemeToggle: ReturnType<typeof useLayout>["onThemeToggle"];
        userId?: ReturnType<typeof useLayout>["userId"];
        userName?: ReturnType<typeof useLayout>["userName"];
        userEmail?: ReturnType<typeof useLayout>["userEmail"];
        userPhone?: ReturnType<typeof useLayout>["userPhone"];
        userBio?: ReturnType<typeof useLayout>["userBio"];
        userCreatedAt?: ReturnType<typeof useLayout>["userCreatedAt"];
    }>;
    audience: ReadonlyArray<Audience>;
};

const audienceRoutes: ReadonlyArray<AudienceRoute> = [
    { path: "/rides", Component: RidesPage, audience: ["guest", "user"] },
    { path: "/passenger", Component: PassengerHomePage, audience: ["user"] },
    {
        path: "/passenger/rides",
        Component: PassengerMyRidesPage,
        audience: ["user"],
    },
    {
        path: "/passenger/rides/search",
        Component: PassengerRidesPage,
        audience: ["user"],
    },
    {
        path: "/passenger/chat",
        Component: PassengerChatPage,
        audience: ["user"],
    },
    {
        path: "/passenger/profile",
        Component: PassengerProfilePage,
        audience: ["user"],
    },
    {
        path: "/passenger/ratings",
        Component: PassengerRatingsPage,
        audience: ["user"],
    },
    { path: "/driver", Component: DriverHomePage, audience: ["user"] },
    { path: "/driver/chat", Component: DriverChatPage, audience: ["user"] },
    {
        path: "/driver/rides",
        Component: DriverMyRidesPage,
        audience: ["user"],
    },
    {
        path: "/driver/rides/passengers",
        Component: DriverPassengersPage,
        audience: ["user"],
    },
    {
        path: "/driver/rides/rate",
        Component: DriverRatePassengersPage,
        audience: ["user"],
    },
    {
        path: "/driver/offer",
        Component: DriverOfferRidePage,
        audience: ["user"],
    },
    {
        path: "/driver/requests",
        Component: DriverRideRequestsPage,
        audience: ["user"],
    },
    {
        path: "/driver/profile",
        Component: DriverProfilePage,
        audience: ["user"],
    },
    {
        path: "/driver/ratings",
        Component: DriverRatingsPage,
        audience: ["user"],
    },
    {
        path: "/profile/edit",
        Component: EditProfilePage,
        audience: ["user", "admin"],
    },
    { path: "/car/add", Component: AddCarPage, audience: ["user"] },
    { path: "/admin", Component: AdminDashboardPage, audience: ["admin"] },
    { path: "/admin/rides", Component: AdminRidesPage, audience: ["admin"] },
    { path: "/admin/users", Component: AdminUsersPage, audience: ["admin"] },
    {
        path: "/admin/reports",
        Component: AdminReportsPage,
        audience: ["admin"],
    },
    {
        path: "/admin/account",
        Component: AdminAccountPage,
        audience: ["admin"],
    },
    { path: "/login", Component: LoginPage, audience: ["guest"] },
    {
        path: "/forgot-password",
        Component: ForgotPasswordPage,
        audience: ["guest"],
    },
    { path: "/register", Component: RegisterPage, audience: ["guest"] },
    { path: "/onboarding", Component: OnboardingPage, audience: ["user"] },
];

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomeRoute,
    beforeLoad: requireAudience(["guest"]),
});

const childRoutes = audienceRoutes.map(({ path, Component, audience }) =>
    createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: makeAudienceComponent(Component),
        beforeLoad: requireAudience(audience),
    })
);

const routeTree = rootRoute.addChildren([homeRoute, ...childRoutes]);

export function createAppRouter(queryClient: QueryClient) {
    return createRouter({
        routeTree,
        context: { queryClient },
    });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
    interface Register {
        router: AppRouter;
    }
}
