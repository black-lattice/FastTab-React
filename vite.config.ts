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
				manualChunks(id) {
					if (id.includes('pinyin-pro')) return 'bookmark-pinyin';
					if (
						id.includes('commonjsHelpers') ||
						id.includes('/react/') ||
						id.includes('/react-dom/') ||
						id.includes('/scheduler/')
					) return 'vendor';
					if (
						id.includes('/antd/') ||
						id.includes('/@ant-design/') ||
						id.includes('/@rc-component/') ||
						id.includes('/rc-') ||
						id.includes('/react-is/')
					) return 'antd';
					if (id.includes('/zustand/')) return 'state';
				}
			}
		}
	}
});
