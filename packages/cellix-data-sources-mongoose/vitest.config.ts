import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config.ts';

export default mergeConfig(baseConfig, defineConfig({
  // Add package-specific overrides here if needed
  test: {
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
    retry: 0,
    coverage: {
        exclude: [
            "**/index.ts",
            "**/base.ts"
        ]
    }
  }
}));