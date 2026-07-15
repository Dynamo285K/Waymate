import { type ComponentProps } from "react";
import { AuthNavbar } from "@/components/navigation/AuthNavbar";

type AuthNavbarFrameProps = ComponentProps<typeof AuthNavbar>;

export function AuthNavbarFrame(props: AuthNavbarFrameProps) {
    return (
        <header className="sticky top-0 z-1000 w-full bg-background border-b border-border shadow-dropdown-strong">
            <AuthNavbar {...props} />
        </header>
    );
}
