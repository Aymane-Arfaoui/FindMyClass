const typescriptParser = require("@typescript-eslint/parser");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [

    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./tsconfig.json",
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": [
                "warn",
                { allowExpressions: true },
            ],
            "@typescript-eslint/no-empty-function": "warn",
            semi: ["error", "always"],
        },
        plugins: {
            "@typescript-eslint": typescriptPlugin,
        },
    },

    {
        files: ["**/*.js", "**/*.jsx"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-console": "warn",
            "semi": ["error", "always"],
        },
    },
];

