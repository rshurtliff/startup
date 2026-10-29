import { defineConfig } from 'vite';

// While developing, Vite sends any fetch to /api on to the service on port 4000
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
