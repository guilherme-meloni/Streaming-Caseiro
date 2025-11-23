import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
        prerender: {
            entries: ['*', '/downloads']
        },
        csp: {
            directives: {
                'media-src': ['self', 'http://100.89.81.37:3000', 'http://localhost', 'blob:'],
                'img-src': ['self', 'http://100.89.81.37:3000', 'data:', 'https://image.tmdb.org', 'https://placehold.co'],
                'connect-src': ['self', 'http://100.89.81.37:3000', 'ws://100.89.81.37:3000'],
                'script-src': ['self', 'unsafe-inline'],
                'worker-src': ['self'],
                'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
                'style-src-elem': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
                'font-src': ['self', 'https://fonts.gstatic.com'],
                'default-src': ['self', 'capacitor-electron://*']
            }
        }
	}
};

export default config;