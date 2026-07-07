import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin in production (the demo server serves dist/); proxied in dev.
      '/api': 'http://localhost:8402',
    },
  },
})
