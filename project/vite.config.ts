import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    port: 5173
  },
  resolve: {
    alias: {
      '@uiw/react-md-editor': '@uiw/react-md-editor/nohighlight'
    }
  }
});