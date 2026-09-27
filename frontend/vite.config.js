import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/quiz_app/',
  server: {
    proxy: {
      '/api': {
        target: 'https://quiz-app-xyk0.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
