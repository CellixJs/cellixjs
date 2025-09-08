import { defineConfig, mergeConfig } from 'vitest/config';
import backendConfig from '../vitest.backend.config.ts';

export default mergeConfig(backendConfig, defineConfig({
  test: {
    include: ["**/*.arch.test.ts"],
    testTimeout: 30000, // Architecture tests may take longer due to file analysis
    coverage: {
      exclude: [
        "shared/**",
        "package-tests/**",
        "**/*.arch.test.ts",
      ]
    }
  },
}));