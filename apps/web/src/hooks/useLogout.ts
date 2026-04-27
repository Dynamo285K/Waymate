import { useNavigate } from "../lib/router-compat";
import { signOut } from "../lib/auth";

export function useLogout() {
    const navigate = useNavigate();

    return async () => {
        try {
            await signOut();
        } finally {
            navigate("/login");
        }
    };
}
