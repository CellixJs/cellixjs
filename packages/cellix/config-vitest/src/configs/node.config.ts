import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig, createDefaultTypecheckConfig, defaultTestIncludePatterns } from "./base.config.ts";

export const nodeConfig = mergeConfig(baseConfig, defineConfig({
  test: {
    typecheck: createDefaultTypecheckConfig(),
    include: [...defaultTestIncludePatterns],
    environment: "node",
    testTimeout: 5000,
    coverage: {
      excludeAfterRemap: true,
      exclude: [
        "**/*.test.*",
        "**/*.spec.*",
        "**/*.stories.*",
        "**/*.generated.ts",
        "**/*.generated.tsx",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.config.*",
        "**/vite.config.*",
        "**/coverage/**",
        "**/.storybook/**",
        "**/tsconfig*.json",
        "**/dist/**",
        "**/deploy/**",
        "node_modules/**",
      ],
    },
  },
}));
