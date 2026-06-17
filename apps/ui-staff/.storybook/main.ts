import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);

/**
 * Resolves the absolute path of a package.
 * Required for monorepo setups and Yarn PnP.
 */
function getAbsolutePath(value: string) {
	return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)', '../../../packages/ocom/ui-shared/src/**/*.stories.@(js|jsx|mjs|ts|tsx)', '../../../packages/ocom/ui-staff-*/src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		getAbsolutePath('@chromatic-com/storybook'),
		getAbsolutePath('@storybook/addon-docs'),
		getAbsolutePath('@storybook/addon-onboarding'),
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@storybook/addon-vitest'),
		'storybook-addon-apollo-client',
	],
	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},
};
export default config;
