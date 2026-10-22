import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A dedicated port so this project never shares 5173 with other local Vite apps.
// strictPort makes Vite stop with an error instead of silently doubling up.
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5180, strictPort: true },
  preview: { host: '0.0.0.0', port: 5181, strictPort: true },
});
