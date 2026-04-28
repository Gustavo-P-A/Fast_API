import { defineConfig } from 'vite' // 1
import react from '@vitejs/plugin-react-swc'//2

export default defineConfig({ //3
  plugins: [react()],
  server: {
    port: 3000, //4
    proxy: {
      '/api': {
        target: 'http://localhost:8000',//5
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

