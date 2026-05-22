import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/Hospital-Management-System-homepage/',
  plugins: [react()],
  resolve: {
    // Force all React imports to use the homepage's own React 19 install
    // This prevents the monorepo root's React 18 (used by hms-app) from leaking in
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

