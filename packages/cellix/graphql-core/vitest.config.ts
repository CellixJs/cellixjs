import { nodeConfig } from '@cellix/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({
  // Add package-specific overrides here if needed
  test: {
    coverage: {
        exclude: [
            "**/index.ts",
            "**/graphql-tools-scalars.ts"
        ]
    }
  }
}));