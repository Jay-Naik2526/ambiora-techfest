import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        events: resolve(__dirname, 'events.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        myEvents: resolve(__dirname, 'my-events.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        eventDetail: resolve(__dirname, 'event-detail.html'),
        faculty: resolve(__dirname, 'faculty.html'),
        team: resolve(__dirname, 'team_members.html'),
        admin: resolve(__dirname, 'admin.html'),
        timeline: resolve(__dirname, 'timeline.html'),
        profile: resolve(__dirname, 'profile.html'),
        myTeams: resolve(__dirname, 'my-teams.html')
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
