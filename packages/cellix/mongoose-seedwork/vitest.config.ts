import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({
  // Add package-specific overrides here if needed
  test: {
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
    retry: 0,
    testTimeout: 20000,
    coverage: {
        exclude: [
            "**/index.ts",
            "**/base.ts"
        ]
    }
  }
}));
