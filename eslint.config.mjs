import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/coverage/**",
            "**/.turbo/**",
            "**/*.db",
            "**/*.sqlite",
            "**/*.sqlite3",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/consistent-type-imports": "warn",
        },
    },
    {
        files: ["scripts/**/*.{js,mjs,cjs}"],
        languageOptions: {
            globals: {
                process: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
            },
        },
    },
];
