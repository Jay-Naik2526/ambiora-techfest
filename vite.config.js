import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        events: resolve(__dirname, 'events.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        myEvents: resolve(__dirname, 'my-events.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: true,
    hmr: {
      protocol: 'wss',
      host: 'muskier-nonreverentially-jonelle.ngrok-free.dev'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
