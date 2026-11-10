import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev/preview servers fall back to index.html for unknown paths, so
// BrowserRouter deep links such as /event/ev_launch work out of the box.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
