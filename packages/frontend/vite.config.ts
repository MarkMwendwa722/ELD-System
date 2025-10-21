import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ELD-System/',
  plugins: [react() as unknown as PluginOption],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/django': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/django/, '')
      },
      '/api/node': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/node/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})