import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "./base.config.ts";

export const nodeConfig = mergeConfig(baseConfig, defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    testTimeout: 5000,
    coverage: {
      include: ['src/**/*.ts'],
    },
  },
}));