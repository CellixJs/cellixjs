import { nodeConfig } from '@cellix/vitest-config';
// @ts-ignore [TS7]
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({
  // Add package-specific overrides here if needed
  test: {
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
    retry: 0,
    coverage: {
        exclude: [
            "tests/**",
        ]
    }
  },
}));