import { defineConfig, mergeConfig } from 'vitest/config';
import backendConfig from '../../vitest.backend.config.ts';

export default mergeConfig(backendConfig, defineConfig({
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