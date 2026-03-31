import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from '@cellix/config-vitest';

export default mergeConfig(baseConfig, defineConfig({
  plugins: [react()],
  // Add package-specific overrides here if needed
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.config.{js,ts}',
        'src/test/**',
        '**/setup.{js,ts}'
      ],
    },
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
