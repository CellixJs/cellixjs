import { defineConfig } from 'vitest/config';

export const defaultTestIncludePatterns = ['**/*.{test,spec}.?(c|m)[jt]s?(x)', 'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'];

export function createDefaultTypecheckConfig() {
	return {
		enabled: true,
		checker: 'tsgo' as const,
		tsconfig: 'tsconfig.vitest.json',
		include: [...defaultTestIncludePatterns],
		exclude: ['**/node_modules/**', 'src/archunit-tests/**', '**/dist/**', '**/coverage/**'],
		ignoreSourceErrors: true,
	};
}

export const baseConfig = defineConfig({
	test: {
		exclude: ['**/node_modules/**', '**/dist/**', 'src/archunit-tests/**'],
		coverage: {
			provider: 'istanbul',
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage',
		},
	},
});
