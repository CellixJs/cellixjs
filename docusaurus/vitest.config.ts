import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'build/',
        '.docusaurus/',
        'static/',
        'docs/',
        'blog/',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}',
        'src/test/',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
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
});
