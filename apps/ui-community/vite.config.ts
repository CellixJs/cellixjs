import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type PluginOption } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const isDev = mode === 'development';
	const isProd = mode === 'production';

	return {
		plugins: [react() as PluginOption, ...(isProd ? [nodePolyfills({ include: ['util'], globals: { Buffer: false, global: false, process: false } }) as PluginOption] : []), ...(isDev ? [visualizer() as PluginOption] : [])],
		server: process.env.PORTLESS_URL
			? undefined
			: {
					port: 3000,
				},
	};
});
