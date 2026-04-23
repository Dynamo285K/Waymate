import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "waymate-ui": fileURLToPath(
                new URL("../../../waymate-ui/src/index.ts", import.meta.url)
            ),
        },
        dedupe: ["react", "react-dom"],
    },
});
