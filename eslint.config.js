import globals from "globals";
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    { ignores: ["dist", "node_modules", "live-transcript", ".DS_Store"] },
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx}"],
        plugins: {
            react: reactPlugin,
            "react-hooks": hooksPlugin,
            "react-refresh": reactRefresh,
        },
        languageOptions: {
            ...js.configs.recommended.languageOptions,
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...hooksPlugin.configs.recommended.rules,
            eqeqeq: "error",
            "react/react-in-jsx-scope": "off",
            "react/self-closing-comp": "warn",
            "react/prop-types": "off",
            "react/jsx-no-target-blank": "off",
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
            "no-console": "error",
        },
        settings: { react: { version: "detect" } },
    },
];
