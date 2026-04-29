import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["dist", "src/api-client/**"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
    {
        files: ["src/pages/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector: "JSXOpeningElement[name.name='button']",
                    message:
                        "Use Button from @waymate/ui instead of raw <button>.",
                },
                {
                    selector: "JSXOpeningElement[name.name='input']",
                    message:
                        "Use Input from @waymate/ui instead of raw <input>.",
                },
                {
                    selector: "JSXOpeningElement[name.name='select']",
                    message:
                        "Use Select from @waymate/ui instead of raw <select>.",
                },
                {
                    selector: "JSXOpeningElement[name.name='textarea']",
                    message:
                        "Use Textarea from @waymate/ui instead of raw <textarea>.",
                },
            ],
        },
    },
]);
