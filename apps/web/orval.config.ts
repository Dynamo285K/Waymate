import { defineConfig } from "orval";

export default defineConfig({
    waymate: {
        input: "../api/openapi.json",
        output: {
            mode: "tags-split",
            target: "src/api-client/index.ts",
            schemas: "src/api-client/model",
            client: "react-query",
            httpClient: "fetch",
            clean: true,
            prettier: true,
            override: {
                mutator: {
                    path: "src/lib/api-fetcher.ts",
                    name: "apiFetcher",
                },
                query: {
                    useQuery: true,
                    useMutation: true,
                    signal: false,
                },
                fetch: {
                    includeHttpResponseReturnType: false,
                },
            },
        },
    },
});
