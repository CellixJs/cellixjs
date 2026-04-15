import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html', '../../packages/ocom/ui-community-route-*/src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [],
	corePlugins: {
		preflight: false,
	},
} satisfies Config;
