import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAudience } from "../../lib/route-guards";

export const Route = createFileRoute("/forgot-password")({
    beforeLoad: requireAudience(["guest"]),
    component: ForgotPasswordRoute,
});

function ForgotPasswordRoute() {
    return <Outlet />;
}
