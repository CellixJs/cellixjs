import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { baseConfig } from './base.config.ts';

export type StorybookVitestConfigOptions = {
  storybookDirRelativeToPackage?: string; // default: '.storybook'
  setupFiles?: string[]; // default: ['.storybook/vitest.setup.ts']
  browsers?: { browser: 'chromium' | 'firefox' | 'webkit' }[]; // default: [{ browser: 'chromium' }]
  additionalCoverageExclude?: string[];
};

export async function createStorybookVitestConfig(pkgDirname: string, opts: StorybookVitestConfigOptions = {}): Promise<ViteUserConfig> {
  const STORYBOOK_DIR = opts.storybookDirRelativeToPackage ?? '.storybook';
  const setupFiles = opts.setupFiles ?? ['.storybook/vitest.setup.ts'];
  const instances = opts.browsers ?? [{ browser: 'chromium' }];

  const base = mergeConfig(baseConfig, defineConfig({
          test: {
              globals: true,
              projects: [
                  {
                      extends: true,
                      plugins: [
                          storybookTest({
                              configDir: path.join(pkgDirname, STORYBOOK_DIR),
                          }),
                      ],
                      test: {
                          name: 'storybook',
                          browser: {
                              provider: playwright(),
                              instances: instances.map(i => ({ ...i, launch: { slowMo: 100 } }))
                          },
                          setupFiles,
                      },
                  },
              ],
              coverage: {
                  exclude: [
                      '**/*.config.ts',
                      '**/tsconfig.json',
                      '**/.storybook/**',
                      '**/*.stories.ts',
                      '**/*.stories.tsx',
                      '**/*.test.ts',
                      '**/*.test.tsx',
                      '**/generated.ts',
                      '**/generated.tsx',
                      '**/coverage/**',
                      '**/*.d.ts',
                      'dist/**',
                      ...(opts.additionalCoverageExclude ?? []),
                  ],
              },
          },
      }));

  return mergeConfig(base, defineConfig({}));
}
