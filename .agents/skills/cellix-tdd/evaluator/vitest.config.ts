import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: '.agents/skills/cellix-tdd/evaluator',
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		passWithNoTests: false,
	},
});
