import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['./']
		},
		proxy: {
			'/api': {
				target: 'http://100.89.81.37:3000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '/api')
			},
			'/uploads': {
				target: 'http://100.89.81.37:3000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/uploads/, '/uploads')
			}
		}
	},
	build: {
		rollupOptions: {
			external: [
				'@capacitor/core',
				'@capacitor/screen-orientation',
				'@capacitor/status-bar'
			]
		}
	}
});
