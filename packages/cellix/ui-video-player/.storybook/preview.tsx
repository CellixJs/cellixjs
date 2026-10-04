import type { Parameters } from '@storybook/react';

export const parameters: Parameters = {
	layout: 'padded',
	actions: { argTypesRegex: '^on[A-Z].*' },

	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/i,
		},
	},

	a11y: {
		// 'todo' - show a11y violations in the test UI only
		// 'error' - fail CI on a11y violations
		// 'off' - skip a11y checks entirely
		test: 'todo',
	},
};
