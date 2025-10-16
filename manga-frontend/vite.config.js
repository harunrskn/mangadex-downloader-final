import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = process.env.VITE_API_BASE || 'http://127.0.0.1:5000' // pakai IPv4

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target, changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target, changeOrigin: true } }, // <— tambahkan ini
  },
})
