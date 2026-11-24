import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs, so the build works on GitHub Pages, which serves
  // it from /<repo-name>/ rather than the site root.
  base: './',
  plugins: [react()],
})
