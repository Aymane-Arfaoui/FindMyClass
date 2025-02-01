const typescriptParser = require("@typescript-eslint/parser");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");
const babelParser = require("@babel/eslint-parser");

module.exports = [
    // TypeScript configuration
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
            semi: ["off"],

        },
        plugins: {
            "@typescript-eslint": typescriptPlugin,
        },
    },

    // JavaScript and JSX configuration
    {
        files: ["**/*.js", "**/*.jsx"],
        languageOptions: {
            parser: babelParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                requireConfigFile: false, // Ensures Babel works without an extra config file
                babelOptions: {
                    presets: ["@babel/preset-react"], // Enables JSX parsing
                },
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "no-console": "warn",
            "semi": ["off"],
        },
    },
];
