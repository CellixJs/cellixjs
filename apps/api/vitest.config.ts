import { nodeConfig } from '@cellix/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/service-config/**', 'src/index.ts'],
    },
  },
}));
