import path from 'node:path';
// @ts-ignore [TS7]
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@cellix/vitest-config';

export default mergeConfig(baseConfig, defineConfig({
  // Add package-specific overrides here if needed
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      exclude: [
        'node_modules/',
        'build/',
        '.docusaurus/',
        'coverage/**',
        'static/',
        'docs/',
        'blog/',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}',
        'src/test/',
        '**/setup.{js,ts}'
      ],
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@site': path.resolve(__dirname, '.'),
      '@docusaurus/Link': path.resolve(__dirname, 'src/test/mocks/Link.tsx'),
      '@docusaurus/useDocusaurusContext': path.resolve(__dirname, 'src/test/mocks/useDocusaurusContext.ts'),
      '@theme/Layout': path.resolve(__dirname, 'src/test/mocks/Layout.tsx'),
      '@theme/Heading': path.resolve(__dirname, 'src/test/mocks/Heading.tsx'),
    },
  },
}));