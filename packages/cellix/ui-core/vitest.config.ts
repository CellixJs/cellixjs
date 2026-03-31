import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStorybookVitestConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  mergeConfig(
    createStorybookVitestConfig(dirname, {
      additionalCoverageExclude: [
        'src/index.ts',
        'src/components/index.ts',
        'vitest.setup.ts',
        'src/components/molecules/index.tsx',
        'src/components/organisms/index.tsx',
      ],
      additionalProjects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'jsdom',
            include: ['src/**/*.test.tsx'],
            setupFiles: ['./vitest.setup.ts'],
          },
        },
      ],
    }),
    {
      test: {
        coverage: {
          provider: 'istanbul',
        },
      },
    }
  )
);
