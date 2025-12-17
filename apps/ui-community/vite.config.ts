import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type PluginOption } from 'vite'

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === 'development';

// Ensure heavyweight dependencies are split into named chunks to avoid giant vendor blobs.
const dependencyChunkRules: Array<[RegExp, string]> = [
  [/node_modules\/react[\/]/, 'vendor-react'],
  [/node_modules\/react-dom[\/]/, 'vendor-react'],
  [/node_modules\/react-router-dom[\/]/, 'vendor-react'],
  [/node_modules\/@ant-design[\/]/, 'vendor-antd'],
  [/node_modules\/antd[\/]/, 'vendor-antd'],
  [/node_modules\/@apollo[\/]/, 'vendor-apollo'],
  [/node_modules\/apollo[-\/]/, 'vendor-apollo'],
  [/node_modules\/@cellix\//, 'vendor-cellix'],
  [/node_modules\/@ocom\//, 'vendor-cellix'],
]

const chunkForDependency = (id: string): string | undefined => {
  if (!id.includes('node_modules')) {
    return undefined;
  }
  for (const [matcher, chunkName] of dependencyChunkRules) {
    if (matcher.test(id)) {
      return chunkName;
    }
  }
  return 'vendor';
};

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
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: (id) => chunkForDependency(id ?? ''),
      },
    },
  },
})