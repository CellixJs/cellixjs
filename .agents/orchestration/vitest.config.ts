import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: '.agents/orchestration',
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		passWithNoTests: false,
	},
});
