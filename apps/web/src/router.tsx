import { lazy, Suspense, type ComponentType } from "react";
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
import { RouteErrorBoundary } from "./components/shared/RouteErrorBoundary";
import { makeAudienceComponent } from "./lib/make-audience-component";
import {
    CURRENT_USER_QUERY_KEY,
    getCurrentUserOrNull,
    hasCompletedOnboarding,
} from "./lib/auth";
import type { User } from "./api-client/model/user";
import type { UserRole } from "./api-client/model/userRole";

// Layout props every audience page receives (injected by makeAudienceComponent).
type AudiencePageProps = {
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
};

// Code-splits each page into its own chunk. The `import("./pages/X")` literal
// stays inside the thunk so the bundler can statically split it; the named
// export is rewrapped as `default` for React.lazy. Result: a guest on /login
// no longer downloads the admin/driver pages.
function lazyPage(
    loader: () => Promise<Record<string, unknown>>,
    name: string
) {
    return lazy(() =>
        loader().then((m) => ({
            default: m[name] as ComponentType<AudiencePageProps>,
        }))
    );
}

const LoginPage = lazyPage(
    () => import("./pages/auth/login/LoginPage"),
    "LoginPage"
);
const RegisterPage = lazyPage(
    () => import("./pages/auth/register/RegisterPage"),
    "RegisterPage"
);
const OnboardingPage = lazyPage(
    () => import("./pages/auth/onboarding/OnboardingPage"),
    "OnboardingPage"
);
const ForgotPasswordPage = lazyPage(
    () => import("./pages/auth/forgot-password/ForgotPasswordPage"),
    "ForgotPasswordPage"
);
const RidesPage = lazyPage(
    () => import("./pages/rides/RidesPage"),
    "RidesPage"
);
const PassengerHomePage = lazyPage(
    () => import("./pages/passenger/home/PassengerHomePage"),
    "PassengerHomePage"
);
const PassengerChatPage = lazyPage(
    () => import("./pages/passenger/chat/PassengerChatPage"),
    "PassengerChatPage"
);
const PassengerRidesPage = lazyPage(
    () => import("./pages/passenger/rides-search/PassengerRidesPage"),
    "PassengerRidesPage"
);
const PassengerMyRidesPage = lazyPage(
    () => import("./pages/passenger/my-rides/PassengerMyRidesPage"),
    "PassengerMyRidesPage"
);
const PassengerProfilePage = lazyPage(
    () => import("./pages/passenger/profile/PassengerProfilePage"),
    "PassengerProfilePage"
);
const PassengerRatingsPage = lazyPage(
    () => import("./pages/passenger/ratings/PassengerRatingsPage"),
    "PassengerRatingsPage"
);
const DriverHomePage = lazyPage(
    () => import("./pages/driver/home/DriverHomePage"),
    "DriverHomePage"
);
const DriverChatPage = lazyPage(
    () => import("./pages/driver/chat/DriverChatPage"),
    "DriverChatPage"
);
const DriverMyRidesPage = lazyPage(
    () => import("./pages/driver/my-rides/DriverMyRidesPage"),
    "DriverMyRidesPage"
);
const DriverPassengersPage = lazyPage(
    () => import("./pages/driver/passengers/DriverPassengersPage"),
    "DriverPassengersPage"
);
const DriverRatePassengersPage = lazyPage(
    () => import("./pages/driver/rate-passengers/DriverRatePassengersPage"),
    "DriverRatePassengersPage"
);
const DriverOfferRidePage = lazyPage(
    () => import("./pages/driver/offer-ride/DriverOfferRidePage"),
    "DriverOfferRidePage"
);
const DriverRideRequestsPage = lazyPage(
    () => import("./pages/driver/ride-requests/DriverRideRequestsPage"),
    "DriverRideRequestsPage"
);
const DriverProfilePage = lazyPage(
    () => import("./pages/driver/profile/DriverProfilePage"),
    "DriverProfilePage"
);
const DriverRatingsPage = lazyPage(
    () => import("./pages/driver/ratings/DriverRatingsPage"),
    "DriverRatingsPage"
);
const EditProfilePage = lazyPage(
    () => import("./pages/profile/edit/EditProfilePage"),
    "EditProfilePage"
);
const AddCarPage = lazyPage(
    () => import("./pages/car/add/AddCarPage"),
    "AddCarPage"
);
const AdminDashboardPage = lazyPage(
    () => import("./pages/admin/dashboard/AdminDashboardPage"),
    "AdminDashboardPage"
);
const AdminRidesPage = lazyPage(
    () => import("./pages/admin/rides/AdminRidesPage"),
    "AdminRidesPage"
);
const AdminUsersPage = lazyPage(
    () => import("./pages/admin/users/AdminUsersPage"),
    "AdminUsersPage"
);
const AdminReviewsPage = lazyPage(
    () => import("./pages/admin/reviews/AdminReviewsPage"),
    "AdminReviewsPage"
);
const AdminReportsPage = lazyPage(
    () => import("./pages/admin/reports/AdminReportsPage"),
    "AdminReportsPage"
);

interface RouterContext {
    queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <LayoutProvider>
            {/* Suspense boundary for the lazily-loaded page chunks below. */}
            <Suspense
                fallback={<div className="min-h-screen bg-(--color-bg)" />}
            >
                <Outlet />
            </Suspense>
        </LayoutProvider>
    ),
});

// Resolve the current user for the route guard. `fetchQuery` reuses the
// `CURRENT_USER_QUERY_KEY` cache while it is fresh (the QueryClient default
// staleTime), so a burst of navigations no longer fans out into one
// `/users/me` request per route change. Auth transitions explicitly drop the
// entry — `LoginPage` invalidates it, `useLogout` removes it — so the next
// guard run re-fetches. `LayoutProvider` shares the same cache entry.
async function fetchUser(queryClient: QueryClient): Promise<User | null> {
    return queryClient.fetchQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: getCurrentUserOrNull,
    });
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
    async ({
        context,
        location,
    }: {
        context: RouterContext;
        location: { pathname: string };
    }): Promise<void> => {
        const user = await fetchUser(context.queryClient);
        const current = audienceFromRole(user?.userRole ?? null);
        if (!allowed.includes(current)) {
            throw redirect({
                to: HOME_BY_AUDIENCE[current] as never,
                replace: true,
            });
        }
        if (current === "user" && user) {
            const onboarded = hasCompletedOnboarding(user);
            if (!onboarded && location.pathname !== "/onboarding") {
                throw redirect({ to: "/onboarding" as never, replace: true });
            }
            if (onboarded && location.pathname === "/onboarding") {
                throw redirect({
                    to: HOME_BY_AUDIENCE.user as never,
                    replace: true,
                });
            }
        }
    };

type AudienceRoute = {
    path: string;
    Component: ComponentType<AudiencePageProps>;
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
        audience: ["user"],
    },
    { path: "/car/add", Component: AddCarPage, audience: ["user"] },
    { path: "/admin", Component: AdminDashboardPage, audience: ["admin"] },
    { path: "/admin/rides", Component: AdminRidesPage, audience: ["admin"] },
    { path: "/admin/users", Component: AdminUsersPage, audience: ["admin"] },
    {
        path: "/admin/reviews",
        Component: AdminReviewsPage,
        audience: ["admin"],
    },
    {
        path: "/admin/reports",
        Component: AdminReportsPage,
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
        defaultErrorComponent: RouteErrorBoundary,
    });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
    interface Register {
        router: AppRouter;
    }
}
