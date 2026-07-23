import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // server: {
  //   port: 3001,
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:3000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
   server: {
    proxy: {
      '/api': {
        target: 'https://quick-report-api.onrender.com',
        changeOrigin: true,
      }
    }
  }
  resolve : {
    alias: {
      "@" : path.resolve(__dirname, "./src/"),
      "_#": path.resolve(__dirname, "../")
    }
  }
})
