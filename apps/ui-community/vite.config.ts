import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type PluginOption } from 'vite'

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === 'development';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react() as PluginOption,
    ...(isDev ? [visualizer() as PluginOption] : []),
  ],
  server: {
    port: 3000,
  },
})