import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type PluginOption } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() as PluginOption, visualizer() as PluginOption],
  server: {
    port: 3000,
  },
})
