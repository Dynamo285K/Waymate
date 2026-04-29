import { useLayout } from "./use-layout";
import { useNavigate } from "./router-compat";
import { HomePage } from "../pages/HomePage";

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
                if (from) params.set("from", from);
                if (to) params.set("to", to);
                if (date) params.set("date", date.toISOString());
                navigate(`/rides?${params.toString()}`);
            }}
            onViewAllRides={() => navigate("/rides")}
        />
    );
}
