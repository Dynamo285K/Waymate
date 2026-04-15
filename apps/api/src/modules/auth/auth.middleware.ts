import { Elysia } from "elysia";
import { auth } from "./auth";

export const isAuthenticated = new Elysia({ name: "better-auth" })
    .mount(auth.handler)
    .macro({
        auth: {
            async resolve({ status, request: { headers } }) {
                const result = await auth.api.getSession({
                    headers,
                });

                if (!result?.user || !result?.session) {
                    return status(401, {
                        error: "Unauthorized",
                    });
                }

                return {
                    user: result.user,
                    session: result.session,
                };
            },
        },
    });
