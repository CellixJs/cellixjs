import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
	return dirname(require.resolve(join(value, 'package.json')));
}
const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../../../packages/ocom/ui-community-route-admin/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../../../packages/ocom/ui-shared/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../../../packages/ocom/ui-community-shared/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../../../packages/ocom/ui-community-route-accounts/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        //'../../../packages/ocom/ui-community-route-admin/src/pages/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../../../packages/ocom/ui-community-route-root/src/pages/**/*.stories.@(js|jsx|mjs|ts|tsx)',
        '../../../packages/ocom/ui-community-route-accounts/src/pages/**/*.stories.@(js|jsx|mjs|ts|tsx)'
        ],
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
