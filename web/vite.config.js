import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // Las fotos subidas sin Cloudinary se guardan como /uploads/... en la API;
    // sin este proxy el navegador las pediria al servidor de Vite y no cargan.
    proxy: {
      '/uploads': 'http://localhost:3000'
    }
  }
})