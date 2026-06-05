import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://129.204.77.119',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://129.204.77.119',
        changeOrigin: true,
      },
      '/docs': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://129.204.77.119',
        changeOrigin: true,
      },
      '/redoc': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://129.204.77.119',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://129.204.77.119',
        changeOrigin: true,
      },
    },
  },
});
