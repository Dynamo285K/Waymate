import { useLayout } from "./use-layout";

export function makeAudienceComponent<P extends ReturnType<typeof useLayout>>(
    Component: React.ComponentType<P>
) {
    return function AudienceRouteComponent() {
        const layout = useLayout();
        return <Component {...(layout as P)} />;
    };
}
