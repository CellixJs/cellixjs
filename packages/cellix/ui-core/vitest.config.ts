import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStorybookVitestConfig } from '@cellix/config-vitest';
import { defineConfig } from 'vitest/config';

const dirname = typeof __dirname === 'undefined' ? path.dirname(fileURLToPath(import.meta.url)) : __dirname;

export default defineConfig(
    createStorybookVitestConfig(dirname, {
      additionalCoverageExclude: [
        'src/index.ts',
        'src/components/index.ts',
        'src/components/molecules/index.tsx',
        'src/components/organisms/index.tsx',
      ],
    },
  )
);
