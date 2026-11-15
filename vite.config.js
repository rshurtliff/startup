import { defineConfig } from 'vite';

// While developing, Vite sends any fetch to /api on to the service on port 4000.
// /ws does the same for the WebSocket. ws: true tells Vite to pass along the
// upgrade request too, not just normal HTTP. On the real server none of this
// is used, since the service serves the page and /ws itself.
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
      },
    },
  },
});
