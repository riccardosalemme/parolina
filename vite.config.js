import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// /      homepage (index.html, HTML statico: buono per i motori di ricerca)
// /app/  l'applicazione (app/index.html, Svelte)
// base './': il sito funziona in qualsiasi cartella del server (nginx, GitHub Pages...)
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    rollupOptions: { input: { home: 'index.html', app: 'app/index.html' } },
  },
})
