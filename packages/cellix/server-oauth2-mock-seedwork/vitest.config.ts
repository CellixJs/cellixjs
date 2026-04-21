import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'node',
	},
	resolve: {
		alias: {
			'@cellix/server-oauth2-mock-seedwork': path.resolve(__dirname, 'src/index.ts'),
		},
	},
});
