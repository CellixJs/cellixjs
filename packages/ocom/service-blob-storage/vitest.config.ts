import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '@cellix/vitest-config';

export default mergeConfig(baseConfig, defineConfig({
  // Add package-specific overrides here if needed
}));