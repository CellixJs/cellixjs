/// <reference types="vitest/config" />
/// <reference types="vitest" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { defineConfig } from 'vitest/config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const STORYBOOK_DIR = '.storybook';

// More info at: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    globals: true,
    // Only run the Storybook-based test project; no JSDOM/unit-test setup needed
    projects: [{
      extends: true,
      plugins: [
        // The plugin will run tests for the stories defined in your Storybook config
        storybookTest({
          configDir: path.join(dirname, STORYBOOK_DIR)
        })
      ],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [
            { browser: 'chromium' }
          ]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }],
    coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        reportsDirectory: "coverage",
        exclude: [
            "**/index.ts",
            "**/*.config.ts",
            "**/tsconfig.json",
            "**/.storybook/**",
            "**/*.stories.ts",
            "**/*.stories.tsx",
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/generated.ts",
            "**/generated.tsx",
            "**/*.d.ts",
            "dist/**",
        ]
    }
  }
});