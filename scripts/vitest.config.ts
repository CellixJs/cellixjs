import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['*.test.js'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        '**/*.test.*',
        '**/*.config.*',
        '**/node_modules/**'
      ]
    }
  }
});