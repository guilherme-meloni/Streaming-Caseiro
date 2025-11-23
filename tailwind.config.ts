import type { Config } from 'tailwindcss';

const config: Config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
		theme: {
			extend: {
				// ESTA ALTERAÇÃO É VISUAL
				colors: {
					background: '#0b0b0f',
					surface: '#0f1724',
					muted: '#94a3b8',
					'brand-purple': '#6B21A8',
					'accent-blue': '#1E90FF',
					'text-main': '#F9F9F9',
					'text-subtle': '#A0A3A7'
				},
				fontFamily: {
					sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
				},
				borderRadius: {
					'2xl': '1rem' // 16px
				},
				boxShadow: {
					lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
				},
				transitionTimingFunction: {
					'custom-ease': 'cubic-bezier(.2,.8,.2,1)'
				}
			}
		},	plugins: []
};

export default config;
