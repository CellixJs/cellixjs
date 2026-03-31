import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({
  test: {
    typecheck: {
      enabled: false,
    },
    globals: true,
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 120000,
  },
}));
