import { defineConfig } from 'vite'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Make the base path dynamic so the same build can work for Vercel (root '/')
// and GitHub Pages (repo is served at '/ELD-System/'). Local/dev falls back to '/'.
export default defineConfig(() => {
  const envBase = process.env.VITE_BASE;
  const isVercel = !!process.env.VERCEL;
  const isGitHubActions = !!process.env.GITHUB_ACTIONS;

  const base = envBase ? envBase : isVercel ? '/' : isGitHubActions ? '/ELD-System/' : '/';

  return {
    base,
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
  }
})