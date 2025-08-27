import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createFrontendStorybookVitestConfig } from '../../vitest.frontend.config.ts';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Base Storybook+Vitest config with package-specific coverage excludes merged in
export default defineConfig(
  createFrontendStorybookVitestConfig(dirname, {
    additionalCoverageExclude: [
      '**/index.ts',
      'src/components/molecules/index.tsx',
      'src/components/organisms/index.tsx',
    ],
  }),
);