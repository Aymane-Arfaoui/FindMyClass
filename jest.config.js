module.exports = {
    preset: "jest-expo",
    rootDir: "./",
    collectCoverage: true,
    verbose: true,
    testEnvironment: "node",
    coverageDirectory: "coverage",
    // collectCoverageFrom: [
    //     // "Config/**/*.{js,jsx,ts,tsx}",
    //     "api/**/*.{js,jsx,ts,tsx}",
    //     "app/**/*.{js,jsx,ts,tsx}",
    //     "components/**/*.{js,jsx,ts,tsx}",
    //     //"constants/**/*.{js,jsx,ts,tsx}",
    //     "context/**/*.{js,jsx,ts,tsx}",
    //     "helpers/**/*.{js,jsx,ts,tsx}",
    //     "services/**/*.{js,jsx,ts,tsx}",
    //     "!**/__tests__/**",
    //     "!**/node_modules/**",
    //     "!**/coverage/**",
    //     "!**/dist/**",
    //     "!**/build/**"
    // ],
    coverageReporters: ["json", "lcov", "text", "clover"],
    reporters: ["default"],
    moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
    setupFilesAfterEnv: ['<rootDir>/setup-jest.js'],

};
