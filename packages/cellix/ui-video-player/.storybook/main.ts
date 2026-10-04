import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';
import { createPlaceholderSasToken, getPlaceholderManifestUrl } from '../scripts/azurite-placeholder.ts';

const require = createRequire(import.meta.url);

function getAbsolutePath(value: string) {
	return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	staticDirs: [{ from: '../assets', to: '/assets' }],
	addons: [getAbsolutePath('@chromatic-com/storybook'), getAbsolutePath('@storybook/addon-docs'), getAbsolutePath('@storybook/addon-a11y'), getAbsolutePath('@storybook/addon-vitest')],
	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},
	// Lets the Azurite story play the seeded placeholder (`pnpm run seed:azurite`) with a fresh SAS token.
	env: (config) => ({
		...config,
		STORYBOOK_AZURITE_PLACEHOLDER_URL: getPlaceholderManifestUrl(),
		STORYBOOK_AZURITE_PLACEHOLDER_SAS: createPlaceholderSasToken(),
	}),
};

export default config;
