import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  // No HMR socket or dev-client traffic after loading, even during local development.
  server: { hmr: false },
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'], setupFiles: ['src/test.setup.ts'] },
})
