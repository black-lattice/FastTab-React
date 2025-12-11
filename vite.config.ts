import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	base: './', // 使用相对路径，适合 Chrome 扩展
	build: {
		outDir: 'dist',
		cssCodeSplit: true, // 启用CSS代码分离
		rollupOptions: {
			input: {
				newtab: 'src/newtab.html',
				popup: 'src/popup.html'
			},
			output: {
				// 手动分割块，但不包括CSS
				manualChunks: {
					// 将React相关库分离到vendor chunk
					vendor: ['react', 'react-dom']
				}
			}
		}
	}
});
