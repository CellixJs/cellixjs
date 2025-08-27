import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    testTimeout: 5000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      exclude: [
        "**/*.test.*",
        "**/*.spec.*",
        "**/*.stories.*",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.config.*",
        "**/vite.config.*",
        "**/.storybook/**",
        "**/tsconfig*.json",
        "dist/**",
        "node_modules/**",
      ],
    },
  },
});
