import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，适合 Chrome 扩展
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        newtab: 'src/newtab.html',
        popup: 'src/popup.html'
      }
    }
  }
});
