import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// F1: /api остаётся тем же путём в dev и Docker; секретов в VITE_* нет.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://localhost:8000' } },
});
