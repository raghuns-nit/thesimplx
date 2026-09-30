import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  open: false,
  proxy: {
      '/functions': {
        target: 'https://jnfuiahvibdmhohoezfk.supabase.co',
        changeOrigin: true,
      },
    },
  },
});
