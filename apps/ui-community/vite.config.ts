import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type PluginOption } from 'vite';

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === 'development';

// Define groups for advancedChunks
const dependencyChunkGroups = [
	{
		name: 'vendor-react',
		test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
	},
	{
		name: 'vendor-antd-icons',
		test: /[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/,
	},
	{
		name: 'vendor-antd-pro',
		test: /[\\/]node_modules[\\/]@ant-design[\\/]pro-.*[\\/]/,
	},
	{
		name: 'vendor-antd',
		// Matches @ant-design ONLY if it is NOT followed by /icons or /pro-
		test: /[\\/]node_modules[\\/](antd|@ant-design(?![\\/](icons|pro-))|rc-.*)[\\/]/,
	},
	{
		name: 'vendor-apollo',
		test: /[\\/]node_modules[\\/](@apollo|apollo-.*|graphql)[\\/]/,
	},
	{
		name: 'vendor-cellix',
		test: /[\\/](@cellix|@ocom)[\\/]/,
	},
	{
		name: 'vendor-utils',
		test: /[\\/]node_modules[\\/](lodash|dayjs|date-fns|axios)[\\/]/,
	},
	{
		name: 'vendor',
		test: /[\\/]node_modules[\\/]/,
	},
];

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react() as PluginOption,
		...(isDev ? [visualizer() as PluginOption] : []),
	],
	server: {
		port: 3000,
	},
	build: {
		chunkSizeWarningLimit: 500,
		rolldownOptions: {
			// Still used for compatibility, but Rolldown interprets it
			output: {
				advancedChunks: {
					groups: dependencyChunkGroups,
				},
			},
		},
	},
});
