import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      "blotchy-oratorically-krystina.ngrok-free.dev",
      "localhost",
      "192.168.209.15"
    ]
  }
})