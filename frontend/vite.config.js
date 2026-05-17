import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8082'
const p1Url = process.env.P1_URL || 'http://localhost:8081'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/hubs': {
        target: p1Url,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
