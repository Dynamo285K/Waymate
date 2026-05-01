import {
    createRootRoute,
    createRoute,
    createRouter,
    Outlet,
} from "@tanstack/react-router";
import { LayoutProvider } from "./lib/layout-context";
import type { useLayout } from "./lib/use-layout";
import { HomeRoute } from "./lib/route-components";
import { makeAudienceComponent } from "./lib/make-audience-component";
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

const rootRoute = createRootRoute({
    component: () => (
        <LayoutProvider>
            <Outlet />
        </LayoutProvider>
    ),
});

const audienceRoutes: ReadonlyArray<{
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
}> = [
    { path: "/rides", Component: RidesPage },
    { path: "/passenger", Component: PassengerHomePage },
    { path: "/passenger/rides", Component: PassengerMyRidesPage },
    { path: "/passenger/rides/search", Component: PassengerRidesPage },
    { path: "/passenger/chat", Component: PassengerChatPage },
    { path: "/passenger/profile", Component: PassengerProfilePage },
    { path: "/passenger/ratings", Component: PassengerRatingsPage },
    { path: "/driver", Component: DriverHomePage },
    { path: "/driver/chat", Component: DriverChatPage },
    { path: "/driver/rides", Component: DriverMyRidesPage },
    { path: "/driver/rides/passengers", Component: DriverPassengersPage },
    { path: "/driver/rides/rate", Component: DriverRatePassengersPage },
    { path: "/driver/offer", Component: DriverOfferRidePage },
    { path: "/driver/requests", Component: DriverRideRequestsPage },
    { path: "/driver/profile", Component: DriverProfilePage },
    { path: "/driver/ratings", Component: DriverRatingsPage },
    { path: "/profile/edit", Component: EditProfilePage },
    { path: "/car/add", Component: AddCarPage },
    { path: "/admin", Component: AdminDashboardPage },
    { path: "/admin/rides", Component: AdminRidesPage },
    { path: "/admin/users", Component: AdminUsersPage },
    { path: "/admin/reports", Component: AdminReportsPage },
    { path: "/admin/account", Component: AdminAccountPage },
    { path: "/login", Component: LoginPage },
    { path: "/forgot-password", Component: ForgotPasswordPage },
    { path: "/register", Component: RegisterPage },
    { path: "/onboarding", Component: OnboardingPage },
];

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomeRoute,
});

const childRoutes = audienceRoutes.map(({ path, Component }) =>
    createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: makeAudienceComponent(Component),
    })
);

const routeTree = rootRoute.addChildren([homeRoute, ...childRoutes]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
