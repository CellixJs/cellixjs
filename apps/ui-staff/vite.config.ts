import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type PluginOption } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
	plugins: [react() as PluginOption, ...(isProd ? [nodePolyfills() as PluginOption] : []), ...(isDev ? [visualizer() as PluginOption] : [])],
	server: process.env.PORTLESS_URL
		? undefined
		: {
				port: 3001,
			},
});
