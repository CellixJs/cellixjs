import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: 'tsc',
      tsconfig: 'tsconfig.vitest.json',
      include: [
        '**/*.{test,spec}.?(c|m)[jt]s?(x)',
        'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
      ],
      ignoreSourceErrors: true,
    },
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
