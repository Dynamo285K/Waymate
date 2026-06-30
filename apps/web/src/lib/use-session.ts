import { useQuery } from "@tanstack/react-query";
import { sessionQueryOptions } from "./route-guards";

// The one session reader for components, backed by the same ["session"] cache
// the route guards prime in beforeLoad — so a read on a guarded route is a
// cache hit, not a second /get-session. Replaces better-auth's
// authClient.useSession() nanostore, collapsing the two session sources into
// one: auth mutations invalidate ["session"] (see auth.ts) and these observers
// refetch automatically.
export function useSession() {
    return useQuery(sessionQueryOptions);
}
