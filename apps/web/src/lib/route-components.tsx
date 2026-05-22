import { lazy } from "react";
import { useLayout } from "./use-layout";
import { useNavigate } from "./router-compat";

// Code-split the landing page like the audience pages (see router.tsx). The
// root route's Suspense boundary covers this lazy load.
const HomePage = lazy(() =>
    import("../pages/HomePage").then((m) => ({ default: m.HomePage }))
);

export function HomeRoute() {
    const layout = useLayout();
    const navigate = useNavigate();
    return (
        <HomePage
            {...layout}
            onLogin={() => navigate("/login")}
            onRegister={() => navigate("/register")}
            onLogoClick={() => navigate("/")}
            onSearch={(from, to, date) => {
                const params = new URLSearchParams();
                if (from) params.set("fromId", from.id);
                if (to) params.set("toId", to.id);
                if (date) params.set("date", date.toISOString());
                navigate(`/rides?${params.toString()}`);
            }}
            onViewAllRides={() => navigate("/rides")}
        />
    );
}
