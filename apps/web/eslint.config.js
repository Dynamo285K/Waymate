import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

const tailwindColorRules = [
    {
        selector:
            "Literal[value=/\\b(bg|text|border|ring|fill|stroke|outline|shadow|accent|caret|placeholder|decoration|divide|from|to|via)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900|950)\\b/]",
        message:
            "Use theme tokens (e.g. bg-primary, text-foreground) instead of Tailwind palette colors.",
    },
    {
        selector:
            "Literal[value=/\\b(bg|text|border|ring|fill|stroke|outline|shadow|accent|caret|placeholder|decoration|divide|from|to|via)-\\[(#|rgb|rgba|hsl|hsla|oklch|oklab)/]",
        message:
            "Use theme tokens instead of Tailwind arbitrary color values.",
    },
];

const pageFormElementRules = [
    {
        selector: "JSXOpeningElement[name.name='button']",
        message: "Use Button from @waymate/ui instead of raw <button>.",
    },
    {
        selector: "JSXOpeningElement[name.name='input']",
        message: "Use Input from @waymate/ui instead of raw <input>.",
    },
    {
        selector: "JSXOpeningElement[name.name='select']",
        message: "Use Select from @waymate/ui instead of raw <select>.",
    },
    {
        selector: "JSXOpeningElement[name.name='textarea']",
        message: "Use Textarea from @waymate/ui instead of raw <textarea>.",
    },
];

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
        rules: {
            "no-restricted-syntax": ["error", ...tailwindColorRules],
        },
    },
    {
        files: ["src/pages/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-syntax": [
                "error",
                ...tailwindColorRules,
                ...pageFormElementRules,
            ],
        },
    },
]);
