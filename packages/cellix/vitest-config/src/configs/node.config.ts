import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "./base.config.ts";

export const nodeConfig = mergeConfig(baseConfig, defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    testTimeout: 5000,
    coverage: {
      exclude: [
        "**/*.test.*",
        "**/*.spec.*",
        "**/*.stories.*",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.config.*",
        "**/vite.config.*",
        "**/coverage/**",
        "**/.storybook/**",
        "**/tsconfig*.json",
        "dist/**",
        "node_modules/**",
      ],
    },
  },
}));