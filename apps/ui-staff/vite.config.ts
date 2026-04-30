import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === 'development';

export default defineConfig({
	plugins: [react() as PluginOption, ...(isDev ? [visualizer() as PluginOption] : [])],
	server: process.env.PORTLESS_URL
		? undefined
		: {
				port: 3001,
			},
});
