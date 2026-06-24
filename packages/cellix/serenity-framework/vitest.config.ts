import { nodeConfig } from '@cellix/config-vitest';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(nodeConfig, {
	test: {
		exclude: ['dist/**', 'node_modules/**'],
	},
});
