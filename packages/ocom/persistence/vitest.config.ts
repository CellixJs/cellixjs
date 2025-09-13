import { defineConfig, mergeConfig } from 'vitest/config';
import backendConfig from '../../../vitest.backend.config.ts';

export default mergeConfig(backendConfig, defineConfig({
  // Add package-specific overrides here if needed
}));