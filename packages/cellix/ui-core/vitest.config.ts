import { createStorybookVitestConfig, getDirnameFromImportMetaUrl } from '@cellix/config-vitest';
import { defineConfig } from 'vitest/config';

const dirname = getDirnameFromImportMetaUrl(import.meta.url);

export default defineConfig(
  createStorybookVitestConfig(dirname, {
    additionalCoverageExclude: [
      'src/index.ts',
      'src/components/index.ts',
      'src/components/molecules/index.tsx',
      'src/components/organisms/index.tsx',
    ],
  }),
);
