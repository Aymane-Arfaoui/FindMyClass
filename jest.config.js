module.exports = {
    collectCoverage: true,
    coverageDirectory: "coverage",
    collectCoverageFrom: [
        "Config/**/*.{js,jsx,ts,tsx}",
        "api/**/*.{js,jsx,ts,tsx}",
        "app/**/*.{js,jsx,ts,tsx}",
        "components/**/*.{js,jsx,ts,tsx}",
        "constants/**/*.{js,jsx,ts,tsx}",
        "context/**/*.{js,jsx,ts,tsx}",
        "helpers/**/*.{js,jsx,ts,tsx}",
        "services/**/*.{js,jsx,ts,tsx}"
    ],
    coverageReporters: ["json", "lcov", "text", "clover"]
};